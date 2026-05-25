import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { CONCEPT_SEEDS } from "@/lib/conceptSeeds";
import { generateDailyCard, toLearnCard } from "@/services/cardGenerator";
import {
  rateLimit, globalRateLimit, getClientIp, rateLimitResponse,
} from "@/lib/rateLimit";

/**
 * GET /api/cards/daily
 *
 * Returns the auto-generated "Today's Drop" card. The card is selected
 * deterministically from CONCEPT_SEEDS so every user sees the same drop
 * for a given day, cached in the cardGenerator's in-memory store so we
 * only pay the Pinecone + Gemini cost once per day per server instance.
 */
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Global cap protects free-tier Gemini quota
  const global = globalRateLimit("llm_daily", 240, 60_000);
  if (!global.allowed) {
    return rateLimitResponse(global, "Daily card is at capacity. Try again shortly.");
  }
  const ip = getClientIp(req);
  const perIp = rateLimit(`daily:${ip}`, 20, 60_000);
  if (!perIp.allowed) {
    return rateLimitResponse(perIp, "Too many requests. Please wait.");
  }

  try {
    // Same day for the whole world by UTC. We could localize later if needed.
    const today = new Date();
    const yyyy = today.getUTCFullYear();
    const mm = String(today.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(today.getUTCDate()).padStart(2, "0");
    const dateKey = `${yyyy}-${mm}-${dd}`;

    // Deterministic seed pick: pick the seed whose index matches the day-of-year
    // mod the seed count. Rotation is stable across server restarts.
    const dayOfYear = Math.floor(
      (Date.UTC(yyyy, today.getUTCMonth(), today.getUTCDate()) -
        Date.UTC(yyyy, 0, 0)) /
        86_400_000,
    );
    const seed = CONCEPT_SEEDS[dayOfYear % CONCEPT_SEEDS.length];

    const generated = await generateDailyCard(seed, dateKey);
    if (!generated) {
      return NextResponse.json(
        { error: "Failed to generate today's card. Please try again later." },
        { status: 503 },
      );
    }

    // Always re-attach the video fields from the CURRENT seed in case the
    // cached card was generated before the seed had a videoEmbedUrl. This
    // makes seed-level video curation take effect without forcing an LLM
    // regeneration — important when Gemini's daily quota is exhausted.
    const card = toLearnCard(generated);
    if (seed.videoEmbedUrl) {
      card.videoEmbedUrl = seed.videoEmbedUrl;
      card.videoCreator = seed.videoCreator;
    }

    return NextResponse.json({ card, dateKey });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "api/cards/daily" } });
    return NextResponse.json(
      { error: "Internal error generating daily card" },
      { status: 500 },
    );
  }
}
