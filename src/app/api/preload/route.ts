import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { scrapeUrl } from "@/services/scraper";
import { ingestDocuments } from "@/services/ingestion";
import { AcademicService } from "@/services/academic";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

// Curated high-quality financial education resources from the SEC
const SEED_URLS = [
  "https://www.investor.gov/introduction-investing/investing-basics/glossary/compound-interest",
  "https://www.investor.gov/introduction-investing/investing-basics/investment-products/mutual-funds-and-exchange-traded-1",
  "https://www.investor.gov/introduction-investing/investing-basics/save-and-invest",
];

export async function POST() {
  // Require authentication — DB seeding is an admin-only operation
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 2 full preloads per hour per user
  const result = rateLimit(`preload:${userId}`, 2, 3_600_000);
  if (!result.allowed) {
    return rateLimitResponse(result, "Preload rate limit exceeded. Please wait before running again.");
  }

  const results = [];
  let totalChunksCreated = 0;

  // 1. Ingest core financial foundations from SEC
  for (const url of SEED_URLS) {
    try {
      const scraped = await scrapeUrl(url);
      const ingestResult = await ingestDocuments([scraped.text], {
        source: scraped.url,
        title: scraped.title,
      });
      totalChunksCreated += ingestResult.chunksCreated;
      results.push({ url, status: "Success", title: scraped.title, chunks: ingestResult.chunksCreated });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`Failed to auto-ingest ${url}:`, message);
      results.push({ url, status: "Failed", error: message });
    }
  }

  // 2. Ingest papers from Springer Nature & Elsevier Scopus
  try {
    const academicResult = await AcademicService.syncAcademicResources("financial literacy");
    if (academicResult.success && academicResult.chunks > 0) {
      totalChunksCreated += academicResult.chunks;
      results.push({
        url: "academic-search-apis",
        status: "Success",
        title: `Search API Sync (${academicResult.sources.join(", ")})`,
        chunks: academicResult.chunks,
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed to query Academic APIs:", message);
  }

  return NextResponse.json({ success: true, totalChunksCreated, details: results });
}
