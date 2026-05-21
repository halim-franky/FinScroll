import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { generateCardBatch } from "@/services/cardGenerator";
import {
  rateLimit, globalRateLimit, getClientIp, rateLimitResponse,
} from "@/lib/rateLimit";

const RequestSchema = z
  .object({
    level: z.enum(["Beginner", "Intermediate", "Advanced", "Quant"]).optional(),
    limit: z.number().int().min(1).max(20).optional().default(8),
  })
  .strict();

export async function POST(req: Request) {
  // Defense in depth: even though proxy.ts blocks unauthenticated requests
  // to this route, we re-verify here so a future proxy misconfiguration
  // can't silently expose an expensive LLM endpoint.
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Global quota: card generation is the most expensive endpoint
  // (Pinecone search × N seeds + Gemini call per seed). Hard ceiling of
  // 60 generations per minute protects free-tier quota even if 100 users
  // simultaneously hit the endpoint from different IPs.
  const global = globalRateLimit("llm_cards", 60, 60_000);
  if (!global.allowed) {
    return rateLimitResponse(global, "Card generation is at capacity. Try again shortly.");
  }

  // ── Per-IP limit: 10 batches per minute per caller
  const ip = getClientIp(req);
  const perIp = rateLimit(`cards:${ip}`, 10, 60_000);
  if (!perIp.allowed) {
    return rateLimitResponse(perIp, "Too many card generation requests. Please wait.");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    // Allow empty body — defaults are fine
    body = {};
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request payload", details: parsed.error.format() },
      { status: 400 }
    );
  }

  try {
    const cards = await generateCardBatch(parsed.data.level, parsed.data.limit);
    return NextResponse.json({ success: true, cards, count: cards.length });
  } catch (err) {
    console.error("Card batch generation failed:", err);
    Sentry.captureException(err, {
      tags: { route: "api/cards" },
      user: { id: userId },
    });
    return NextResponse.json(
      { error: "Failed to generate cards. Please try again." },
      { status: 500 }
    );
  }
}
