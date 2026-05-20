/**
 * Direct seeding script — bypasses the API route.
 * Run with: npx tsx --env-file=.env.local seed.ts
 */
import { scrapeUrl } from "./src/services/scraper";
import { ingestDocuments } from "./src/services/ingestion";
import { AcademicService } from "./src/services/academic";

const SEED_URLS = [
  "https://www.investor.gov/introduction-investing/investing-basics/glossary/compound-interest",
  "https://www.investor.gov/introduction-investing/investing-basics/investment-products/mutual-funds-and-exchange-traded-1",
  "https://www.investor.gov/introduction-investing/investing-basics/save-and-invest",
];

async function seed() {
  console.log("🌱 FinScroll — seeding Pinecone index: finscroll-index\n");
  let totalChunks = 0;

  // 1. SEC articles
  for (const url of SEED_URLS) {
    try {
      process.stdout.write(`  Scraping ${url} ... `);
      const scraped = await scrapeUrl(url);
      const result = await ingestDocuments([scraped.text], {
        source: scraped.url,
        title: scraped.title,
      });
      totalChunks += result.chunksCreated;
      console.log(`✓  ${result.chunksCreated} chunks  (${scraped.title})`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`✗  FAILED — ${msg}`);
    }
  }

  // 2. Academic papers (Springer + Scopus)
  console.log("\n  Polling Springer Nature & Elsevier Scopus APIs ...");
  try {
    const academic = await AcademicService.syncAcademicResources("financial literacy");
    if (academic.success && academic.chunks > 0) {
      totalChunks += academic.chunks;
      console.log(`✓  ${academic.chunks} academic chunks from: ${academic.sources.join(", ")}`);
    } else {
      console.log("  No academic chunks returned (API keys may be missing or rate-limited).");
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`✗  Academic sync failed — ${msg}`);
  }

  console.log(`\n✅ Done. Total chunks ingested: ${totalChunks}`);
}

seed().catch((err) => {
  console.error("Fatal error during seeding:", err);
  process.exit(1);
});
