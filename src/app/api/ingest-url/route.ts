import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { scrapeUrl } from "@/services/scraper";
import { ingestDocuments } from "@/services/ingestion";
import { rateLimit } from "@/lib/rateLimit";

const ingestUrlSchema = z.object({
  url: z.string().url("Must be a valid URL"),
});

export async function POST(req: Request) {
  // Require authentication
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 5 URL ingestions per minute per user
  const { allowed } = rateLimit(`ingest-url:${userId}`, 5, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { url } = ingestUrlSchema.parse(body);

    const scrapedData = await scrapeUrl(url);
    const ingestionResult = await ingestDocuments(
      [scrapedData.text],
      { source: scrapedData.url, title: scrapedData.title }
    );

    return NextResponse.json({
      success: true,
      data: { title: scrapedData.title, chunks: ingestionResult.chunksCreated },
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid URL provided", details: error.issues },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to process URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
