import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { semanticSearch } from "@/services/search";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rateLimit";

const searchSchema = z.object({
  query: z.string().min(1, "Query cannot be empty").max(500, "Query is too long"),
  limit: z.number().min(1).max(20).optional().default(3),
});

export async function POST(req: Request) {
  // Rate limiting: 30 requests per minute per IP
  const ip = getClientIp(req);
  const result = await rateLimit(`search:${ip}`, 30, 60_000);
  if (!result.allowed) {
    return rateLimitResponse(result);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
  }

  try {
    const { query, limit } = searchSchema.parse(body);
    const results = await semanticSearch(query, limit);
    return NextResponse.json({ success: true, results });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request payload", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Search API Error:", error);
    Sentry.captureException(error, { tags: { route: "api/search" } });
    return NextResponse.json({ error: "Failed to perform search." }, { status: 500 });
  }
}
