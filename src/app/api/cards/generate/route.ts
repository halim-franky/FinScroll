import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import {
  getOrGenerateBySeedId,
  pickFreshSeed,
} from "@/services/cardGenerator";
import {
  rateLimit,
  globalRateLimit,
  rateLimitResponse,
} from "@/lib/rateLimit";

/**
 * POST /api/cards/generate
 *
 * Returns one RAG-generated card on demand. Powers the "infinite scroll"
 * extension of the Learn feed — once a user reaches the end of the
 * static + daily cards, the client fetches additional cards from here.
 *
 * Free-tier strategy (so a portfolio app costs $0):
 *   • Per-user rate limit: 5 / minute   — stops one user burning quota
 *   • Per-user hour cap:   30 / hour    — caps any single bad actor
 *   • Global rate limit:   200 / minute — protects free Gemini tier
 *   • Shared Supabase cache: same seed always returns the same card
 *     across all users, so after ~20 unique seeds are warm every
 *     request is a cache hit (no Gemini call).
 *
 * On 429 the response includes `fallback: true` so the client knows to
 * recycle the static card pool instead of showing an error.
 */

const BodySchema = z
  .object({
    excludeSeedIds: z.array(z.string().min(1).max(80)).max(200).optional(),
  })
  .strict();

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Rate limits (cheapest cap first) ─────────────────────────────
  const global = globalRateLimit("llm_generate", 200, 60_000);
  if (!global.allowed) {
    return NextResponse.json(
      {
        error: "Card generation is at capacity. Recycling the static pool.",
        fallback: true,
      },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const perMinute = rateLimit(`gen:min:${userId}`, 5, 60_000);
  if (!perMinute.allowed) {
    return rateLimitResponse(perMinute, "Slow down — give us a sec.");
  }

  const perHour = rateLimit(`gen:hour:${userId}`, 30, 60 * 60_000);
  if (!perHour.allowed) {
    return NextResponse.json(
      {
        error: "Hourly generation cap reached. Recycling the static pool.",
        fallback: true,
      },
      { status: 429, headers: { "Retry-After": "3600" } },
    );
  }

  // ── Parse body ───────────────────────────────────────────────────
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    // Empty body is OK
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request payload" },
      { status: 400 },
    );
  }

  const excludeSeedIds = parsed.data.excludeSeedIds ?? [];

  // ── Pick a seed + fetch/generate ─────────────────────────────────
  try {
    const seed = pickFreshSeed(excludeSeedIds);
    const result = await getOrGenerateBySeedId(seed.id);
    if (!result) {
      // Generation failed for this seed — tell the client to fall back.
      // Better than a 500: the UX should never look broken just because
      // Gemini had a hiccup.
      return NextResponse.json(
        {
          error: "Couldn't generate a fresh card. Recycling the static pool.",
          fallback: true,
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      card: result.card,
      seedId: seed.id,
      cached: result.cached,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "api/cards/generate" } });
    return NextResponse.json(
      {
        error: "Internal error generating card. Recycling the static pool.",
        fallback: true,
      },
      { status: 500 },
    );
  }
}
