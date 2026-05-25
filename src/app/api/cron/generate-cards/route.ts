import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { CONCEPT_SEEDS } from "@/lib/conceptSeeds";
import { getOrGenerateBySeedId } from "@/services/cardGenerator";
import { getSupabase } from "@/lib/supabase";

/**
 * GET /api/cron/generate-cards
 *
 * Daily Vercel cron job. Picks up to MAX_PER_RUN concept seeds that
 * haven't been generated yet, runs them through the RAG pipeline, and
 * persists to the Supabase `generated_cards` table. Over time the shared
 * cache grows organically without any user-triggered LLM calls.
 *
 * Auth: header `Authorization: Bearer ${CRON_SECRET}`. Vercel cron sends
 * this automatically when CRON_SECRET is set as an env var on the
 * project; any unauthenticated public call gets 401.
 *
 * Why daily + 2 cards: matches Vercel Hobby's free-tier cron frequency
 * (daily) and stays comfortably inside Gemini free-tier quota — 2 calls
 * a day is 0.1% of `gemini-2.0-flash`'s 1,500/day allowance, and we
 * skip seeds already in the cache so we don't waste budget on dupes.
 *
 * Schedule: see vercel.json → crons → /api/cron/generate-cards.
 */

const MAX_PER_RUN = 2;

export async function GET(req: Request) {
  // ── Auth ─────────────────────────────────────────────────────────
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error(
      "[cron/generate-cards] CRON_SECRET env var not set — refusing all calls.",
    );
    return NextResponse.json(
      { error: "Cron is not configured" },
      { status: 503 },
    );
  }

  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  // ── Find seeds not yet in the Supabase cache ─────────────────────
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 },
    );
  }

  let existingIds: Set<string>;
  try {
    const { data, error } = await supabase
      .from("generated_cards")
      .select("seed_id");
    if (error) throw error;
    existingIds = new Set(
      (data ?? []).map((row) => (row as { seed_id: string }).seed_id),
    );
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "api/cron/generate-cards", op: "list" },
    });
    return NextResponse.json(
      { error: "Failed to read existing cache" },
      { status: 500 },
    );
  }

  const candidates = CONCEPT_SEEDS.filter((s) => !existingIds.has(s.id));
  if (candidates.length === 0) {
    return NextResponse.json({
      ok: true,
      message: "Pool is fully warm — every concept seed is already cached.",
      generated: 0,
      cached: existingIds.size,
    });
  }

  // ── Pick up to MAX_PER_RUN seeds at random for variety ───────────
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  const picks = shuffled.slice(0, Math.min(MAX_PER_RUN, shuffled.length));

  // ── Generate sequentially ────────────────────────────────────────
  const results: Array<{
    seedId: string;
    ok: boolean;
    title?: string;
    error?: string;
  }> = [];

  for (const seed of picks) {
    try {
      const out = await getOrGenerateBySeedId(seed.id);
      if (out) {
        results.push({ seedId: seed.id, ok: true, title: out.card.title });
      } else {
        results.push({
          seedId: seed.id,
          ok: false,
          error: "Generator returned null",
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ seedId: seed.id, ok: false, error: message });
      Sentry.captureException(err, {
        tags: {
          route: "api/cron/generate-cards",
          op: "generate",
          seedId: seed.id,
        },
      });
    }
  }

  const successCount = results.filter((r) => r.ok).length;

  return NextResponse.json({
    ok: true,
    generated: successCount,
    attempted: results.length,
    remaining: candidates.length - successCount,
    results,
  });
}
