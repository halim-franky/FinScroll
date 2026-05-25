/**
 * Attach curated YouTube video URLs to existing pool cards WITHOUT any LLM
 * calls. The generate-cards script re-runs the full RAG pipeline and pays
 * Gemini quota for every card. When the only thing changing is the video
 * field, that's wasteful — and when daily quota has been blown, it's
 * impossible. This script is a pure data merge:
 *
 *   for each card in cards-pool.json:
 *     find its matching ConceptSeed (by id, stripping `gen-` prefix)
 *     copy videoEmbedUrl + videoCreator from the seed onto the card
 *     write back
 *
 * Usage: npm run attach:videos
 */
import { writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CONCEPT_SEEDS } from "../src/lib/conceptSeeds";
import type { Card } from "../src/lib/learn/types";

const OUTPUT_PATH = resolve("src/lib/learn/cards-pool.json");

function main() {
  const raw = readFileSync(OUTPUT_PATH, "utf-8");
  const pool: Card[] = JSON.parse(raw);

  let updated = 0;
  let skipped = 0;

  for (const card of pool) {
    // gen-pay-yourself-first → pay-yourself-first
    const seedId = String(card.id).replace(/^gen-/, "");
    const seed = CONCEPT_SEEDS.find((s) => s.id === seedId);
    if (!seed) {
      skipped++;
      continue;
    }
    if (seed.videoEmbedUrl) {
      card.videoEmbedUrl = seed.videoEmbedUrl;
      card.videoCreator = seed.videoCreator;
      updated++;
    } else {
      // Seed has no curated video — leave the card without one
      skipped++;
    }
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(pool, null, 2));
  console.log(`Attached videos to ${updated} card(s); ${skipped} skipped (no curated URL).`);
}

main();
