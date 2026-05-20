import { NextResponse } from "next/server";
import { z } from "zod";
import { generateCardBatch } from "@/services/cardGenerator";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const RequestSchema = z.object({
  level: z.enum(["Beginner", "Intermediate", "Advanced", "Quant"]).optional(),
  limit: z.number().int().min(1).max(20).optional().default(8),
});

export async function POST(req: Request) {
  // Rate limit: 10 batch requests per minute per IP (card generation is expensive)
  const ip = getClientIp(req);
  const { allowed, resetIn } = rateLimit(`cards:${ip}`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many card generation requests. Please wait." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
      }
    );
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
    return NextResponse.json(
      { error: "Failed to generate cards. Please try again." },
      { status: 500 }
    );
  }
}
