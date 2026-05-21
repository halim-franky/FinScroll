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
async function callGeminiJSON(prompt: string): Promise<unknown> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.googleGenAI.apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty response");

  return JSON.parse(text);
}

// ── Generate a single card from a concept seed ───────────────────────────
async function generateCardFromSeed(seed: ConceptSeed): Promise<GeneratedCard | null> {
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
