/**
 * Card generator service.
 *
 * Takes a concept seed → queries Pinecone for grounded context →
 * calls Gemini with structured JSON output → validates with Zod →
 * caches result in memory.
 *
 * The generated cards conform to the same shape that FinTokFeed
 * already renders, so they slot in alongside the curated cards.
 */
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { semanticSearch } from "./search";
import { config } from "../lib/config";
import type { ConceptSeed, Level } from "../lib/conceptSeeds";
import { CONCEPT_SEEDS } from "../lib/conceptSeeds";
import type { Card } from "../lib/learn/types";
import { getSupabase } from "../lib/supabase";
import {
  callGeminiWithFallback,
  GEMINI_FALLBACK_MODELS,
} from "../lib/geminiFallback";

// ── Schema for the LLM response ─────────────────────────────────────────
const CardPayloadSchema = z.object({
  title: z.string().min(5).max(60),
  hook: z.string().min(10).max(120),
  keyFact: z.string().min(50).max(350),
  impactLabel: z.string().min(3).max(40),
  impactValue: z.string().min(2).max(30),
  emoji: z.string().min(1).max(4),
  quiz: z.object({
    question: z.string().min(10).max(180),
    options: z.array(z.string().min(1).max(120)).length(4),
    correctIndex: z.number().int().min(0).max(3),
    explanation: z.string().min(20).max(350),
  }),
});

export type CardPayload = z.infer<typeof CardPayloadSchema>;

export interface GeneratedCard extends CardPayload {
  id: string;
  level: Level;
  topic: string;
  gradient: string;
  creator: string;
  source: string;
  sourceUrl: string;
  generated: true;
}

// ── In-memory cache (per server instance) ────────────────────────────────
const cardCache = new Map<string, GeneratedCard>();

// ── Gemini call with structured JSON output ──────────────────────────────
// Uses the shared fallback ladder (see lib/geminiFallback.ts) AND adds a
// parse-error-aware retry loop on top of it. The shared helper handles
// 429/5xx transports failures; this loop handles the case where Gemini
// returned 200 but the JSON body is truncated or otherwise unparseable
// — common with `gemini-3-flash-preview` because it burns tokens on
// internal "thinking" before emitting output. When that happens we fall
// down the ladder until a more deterministic model (2.0-flash) produces
// clean JSON.
async function callGeminiJSON(prompt: string): Promise<unknown> {
  const models = GEMINI_FALLBACK_MODELS;
  let lastError: Error | null = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const isLast = i === models.length - 1;

    try {
      // Pin to a single model per outer iteration so we control fallback
      // for parse errors. The helper still handles 429/5xx within this
      // single-model call by immediately throwing (since `models: [m]`
      // has no inner fallback to try).
      const { data } = await callGeminiWithFallback(
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            // 4096 — gemini-3-flash-preview's "thinking" eats ~half the
            // budget before output, so we need headroom to fit a full
            // card schema (12 fields + 4 quiz options + explanation).
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        },
        config.googleGenAI.apiKey,
        { callerTag: "cardGenerator", models: [model] },
      );

      // Concatenate all parts so split responses don't truncate at the
      // first part boundary
      const candidates = (
        data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
      )?.candidates;
      const parts: Array<{ text?: string }> = candidates?.[0]?.content?.parts ?? [];
      const text = parts.map((p) => p.text ?? "").filter(Boolean).join("").trim();
      if (!text) throw new Error("Gemini returned empty response");

      const parsed = JSON.parse(text);
      if (i > 0) {
        console.log(`[cardGenerator] ✓ Fallback model "${model}" produced clean JSON`);
      }
      return parsed;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (isLast) throw lastError;

      const isParseError = lastError.message.includes("JSON")
        || lastError.message.includes("Unterminated")
        || lastError.message.includes("Unexpected");
      const reason = isParseError ? "parse failure" : "API failure";
      console.warn(
        `[cardGenerator] ${model} ${reason} (${lastError.message.slice(0, 80)}), falling back to ${models[i + 1]}…`,
      );
      continue;
    }
  }

  // Unreachable — the for-loop returns or throws
  throw lastError ?? new Error("All Gemini fallback models exhausted");
}

// ── Generate a single card from a concept seed ───────────────────────────
// Exported so the offline pre-generation script (scripts/generate-cards.ts)
// can drive generation directly without going through the Supabase cache
// path. The in-memory `cardCache` still serves runtime callers normally.
export async function generateCardFromSeed(seed: ConceptSeed): Promise<GeneratedCard | null> {
  if (cardCache.has(seed.id)) {
    return cardCache.get(seed.id)!;
  }

  try {
    // 1. Retrieve grounded context from Pinecone
    const searchResults = await semanticSearch(seed.concept, 3);
    const context =
      searchResults.length > 0
        ? searchResults.map((r) => `- ${r.text}`).join("\n")
        : "(No specific context available — rely on widely-accepted financial knowledge.)";

    const topSource = searchResults[0]?.metadata?.source as string | undefined;
    const topTitle = searchResults[0]?.metadata?.title as string | undefined;

    // 2. Construct prompt
    const prompt = `You are FinScroll's financial education content generator. Generate ONE TikTok-style finance learning card for Gen Z about: "${seed.concept}".

Use this grounded context retrieved from SEC and peer-reviewed academic sources:
${context}

Output a single JSON object with EXACTLY these fields. Do not include any other fields. Do not wrap in markdown.

{
  "title": "Catchy 3-7 word title (no period at end)",
  "hook": "One punchy italic-style quote that captures the insight, max 100 chars",
  "keyFact": "2-3 sentences explaining the concept with one specific statistic or number. Grounded in the context above. Plain prose, no markdown.",
  "impactLabel": "Short label for the impact metric (e.g., '30-year compound result')",
  "impactValue": "The actual number/result (e.g., '$2.1M', '+12% per year', '95% failure')",
  "emoji": "Single emoji that represents the concept visually",
  "quiz": {
    "question": "Multiple-choice knowledge check that tests understanding of the key insight",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Why the correct answer is right, 1-2 sentences."
  }
}

Rules:
- Write for a financially-curious Gen Z audience: confident, slightly informal, never condescending
- Every claim must be grounded in the context or in widely-accepted financial fact
- Never recommend specific stocks, crypto, or speculative trades
- One of the 4 quiz options must be unambiguously correct; the other 3 should be plausible distractors
- correctIndex must be an integer 0, 1, 2, or 3 matching the position of the correct option`;

    // 3. Call Gemini
    const raw = await callGeminiJSON(prompt);

    // 4. Validate with Zod
    const payload = CardPayloadSchema.parse(raw);

    // 5. Build full card with seed metadata
    const card: GeneratedCard = {
      ...payload,
      id: `gen-${seed.id}`,
      level: seed.level,
      topic: seed.topic,
      gradient: seed.gradient,
      creator: `@finscroll_${seed.level.toLowerCase()}`,
      source: topTitle ?? topSource ?? "SEC Investor.gov & Academic Sources",
      sourceUrl: topSource ?? "investor.gov",
      generated: true,
    };

    cardCache.set(seed.id, card);
    return card;
  } catch (err) {
    console.error(`Card generation failed for seed "${seed.id}":`, err);
    // Capture so we know which seeds keep failing (e.g. Gemini schema
    // mismatches, Pinecone outages, etc.)
    Sentry.captureException(err, {
      tags: { service: "cardGenerator", seedId: seed.id, level: seed.level },
    });
    return null;
  }
}

// ── Daily card: deterministic per (seed, dateKey), cached separately so
//    the seed-keyed batch cache doesn't return yesterday's drop on a new day.
const dailyCache = new Map<string, GeneratedCard>();

export async function generateDailyCard(
  seed: ConceptSeed,
  dateKey: string,
): Promise<GeneratedCard | null> {
  const cacheKey = `${dateKey}::${seed.id}`;
  if (dailyCache.has(cacheKey)) {
    return dailyCache.get(cacheKey)!;
  }

  // Reuse the seed-level generator (it has its own cache, but for daily we
  // re-derive the cacheKey above so we can ship a fresh drop every day).
  // To avoid the seed-cache poisoning yesterday's value, we generate via
  // a temporary path: bypass the seed cache for this call.
  const previous = cardCache.get(seed.id);
  cardCache.delete(seed.id);
  const card = await generateCardFromSeed(seed);
  if (previous) cardCache.set(seed.id, previous);

  if (!card) return null;

  // Re-id for client display so a daily drop doesn't collide with regular
  // generated cards by id.
  const dailyCard: GeneratedCard = {
    ...card,
    id: `daily-${dateKey}-${seed.id}`,
  };
  dailyCache.set(cacheKey, dailyCard);
  return dailyCard;
}

/**
 * Adapter: convert a `GeneratedCard` to the same `Card` shape consumed by
 * the Learn feed and the StoryCard frames. Lets the auto-generated daily
 * drop slot into the same rendering pipeline as hand-curated cards.
 */
export function toLearnCard(g: GeneratedCard): Card {
  return {
    id: g.id,
    level: g.level,
    topic: g.topic,
    gradient: g.gradient,
    emoji: g.emoji,
    title: g.title,
    hook: g.hook,
    keyFact: g.keyFact,
    insight: g.keyFact.split(".")[0] + ".", // first-sentence summary
    impactLabel: g.impactLabel,
    impactValue: g.impactValue,
    quiz: g.quiz,
    source: { name: g.source, url: g.sourceUrl },
    creator: g.creator,
    generated: true,
  };
}

/**
 * Get a card by seedId, using the shared Supabase cache when available.
 *
 * Flow:
 *   1. Try Supabase `generated_cards` (shared across all users)
 *   2. On hit  → bump last_hit_at + hit_count, return Card
 *   3. On miss → generate via Gemini, persist to Supabase, return Card
 *
 * Returns `{ card, cached }` so the caller can tag the response — the
 * client uses this to decide whether to keep fetching aggressively.
 */
export async function getOrGenerateBySeedId(
  seedId: string,
): Promise<{ card: Card; cached: boolean } | null> {
  const seed = CONCEPT_SEEDS.find((s) => s.id === seedId);
  if (!seed) return null;

  const supabase = getSupabase();

  // ── Cache lookup ───────────────────────────────────────────────
  if (supabase) {
    try {
      const { data } = await supabase
        .from("generated_cards")
        .select("card_json")
        .eq("seed_id", seedId)
        .maybeSingle();

      if (data?.card_json) {
        // Fire-and-forget bump — never block the response on telemetry
        supabase
          .from("generated_cards")
          .update({
            last_hit_at: new Date().toISOString(),
            hit_count: ((data as { hit_count?: number }).hit_count ?? 0) + 1,
          })
          .eq("seed_id", seedId)
          .then(() => undefined);

        return { card: data.card_json as Card, cached: true };
      }
    } catch (err) {
      // Cache lookup failure is non-fatal — fall through to generation
      console.warn("[cardGenerator] Supabase cache lookup failed:", err);
    }
  }

  // ── Cache miss → generate ──────────────────────────────────────
  const generated = await generateCardFromSeed(seed);
  if (!generated) return null;

  const card = toLearnCard(generated);

  // ── Persist for the next caller ────────────────────────────────
  if (supabase) {
    try {
      await supabase.from("generated_cards").upsert(
        {
          seed_id: seedId,
          card_json: card,
          last_hit_at: new Date().toISOString(),
        },
        { onConflict: "seed_id" },
      );
    } catch (err) {
      // Persist failure is non-fatal — we still return the freshly
      // generated card. Next caller will just regenerate.
      console.warn("[cardGenerator] Supabase persist failed:", err);
      Sentry.captureException(err, {
        tags: { service: "cardGenerator", op: "persist", seedId },
      });
    }
  }

  return { card, cached: false };
}

/**
 * Pick a concept seed the user hasn't seen yet. Falls back to the
 * least-recently-used seed when they've consumed all of them — so the
 * feed stays "infinite" even after exhausting the full catalogue.
 */
export function pickFreshSeed(excludeSeedIds: string[]): ConceptSeed {
  const excluded = new Set(excludeSeedIds);
  const fresh = CONCEPT_SEEDS.filter((s) => !excluded.has(s.id));
  if (fresh.length > 0) {
    return fresh[Math.floor(Math.random() * fresh.length)];
  }
  // All consumed — cycle back, prefer something other than the most
  // recent if the exclude list still has room to indicate "recent".
  const lastSeen = excludeSeedIds[excludeSeedIds.length - 1];
  const cyclable = CONCEPT_SEEDS.filter((s) => s.id !== lastSeen);
  const pool = cyclable.length > 0 ? cyclable : [...CONCEPT_SEEDS];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Public: generate a batch of cards, optionally filtered by level ─────
export async function generateCardBatch(
  level?: Level,
  limit = 8
): Promise<GeneratedCard[]> {
  const candidates = level
    ? CONCEPT_SEEDS.filter((s) => s.level === level)
    : CONCEPT_SEEDS;

  const selected = candidates.slice(0, Math.min(limit, candidates.length));

  // Run in parallel but cap concurrency at 4 to respect Gemini free tier
  const results: (GeneratedCard | null)[] = [];
  for (let i = 0; i < selected.length; i += 4) {
    const batch = selected.slice(i, i + 4);
    const batchResults = await Promise.all(
      batch.map((seed) => generateCardFromSeed(seed))
    );
    results.push(...batchResults);
  }

  return results.filter((c): c is GeneratedCard => c !== null);
}
