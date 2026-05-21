import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { sanitizeStringArray } from "@/lib/security";
import { ingestDocuments } from "@/services/ingestion";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

const IngestRequestSchema = z.object({
  texts: z.array(z.string()).min(1, "At least one text string is required."),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  // Require authentication
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 5 ingestion requests per minute per user
  const result = rateLimit(`ingest:${userId}`, 5, 60_000);
  if (!result.allowed) {
    return rateLimitResponse(result);
  }

  try {
    const body = await request.json();
    const parsed = IngestRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { texts, metadata } = parsed.data;
    const sanitizedTexts = sanitizeStringArray(texts);

    if (sanitizedTexts.length === 0) {
      return NextResponse.json(
        { error: "No valid text remained after sanitization." },
        { status: 400 }
      );
    }

    const result = await ingestDocuments(sanitizedTexts, metadata as Record<string, string> | undefined);

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to ingest documents into the vector database." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Ingestion successful",
      data: {
        documentsProcessed: result.documentsProcessed,
        chunksCreated: result.chunksCreated,
      },
    });
  } catch (error) {
    console.error("API /api/ingest Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
