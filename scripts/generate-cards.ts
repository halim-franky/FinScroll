/**
 * Offline card pre-generation script.
 *
 * Runs the RAG card generator over every CONCEPT_SEEDS entry, writing
 * results to src/lib/learn/cards-pool.json. Cards in that file are
 * imported at build time and become part of the Learn feed without
 * any runtime API calls — keeping the deployed app at $0 LLM cost.
 *
 * Usage:
 *   npm run generate:cards
 *   npm run generate:cards -- --delay 5000     # slower (5s between calls)
 *   npm run generate:cards -- --max 5          # only generate 5
 *   npm run generate:cards -- --level Beginner # only one level
 *   npm run generate:cards -- --force          # regenerate even if pool has it
 *
 * Resume support: the script writes after every successful card, so
 * if it crashes mid-run, rerun the same command and it will skip
 * anything already in cards-pool.json.
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { CONCEPT_SEEDS, type Level } from "../src/lib/conceptSeeds";
import {
  generateCardFromSeed,
  toLearnCard,
} from "../src/services/cardGenerator";
import type { Card } from "../src/lib/learn/types";

const OUTPUT_PATH = resolve("src/lib/learn/cards-pool.json");
const DEFAULT_DELAY_MS = 4_000; // ≈ 15 RPM ceiling for gemini-2.0-flash free tier

// ── CLI parsing ──────────────────────────────────────────────────────
interface Args {
  delay: number;
  max?: number;
  level?: Level;
  force: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { delay: DEFAULT_DELAY_MS, force: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--delay") args.delay = parseInt(argv[++i] ?? "", 10) || DEFAULT_DELAY_MS;
    else if (a === "--max") args.max = parseInt(argv[++i] ?? "", 10) || undefined;
    else if (a === "--level") {
      const v = argv[++i] as Level;
      if (!["Beginner", "Intermediate", "Advanced", "Quant"].includes(v)) {
        console.error(`Unknown level: ${v}. Must be one of Beginner | Intermediate | Advanced | Quant`);
        process.exit(1);
      }
      args.level = v;
    } else if (a === "--force") args.force = true;
    else if (a === "--help" || a === "-h") {
      console.log("Usage: npm run generate:cards [-- --delay MS] [--max N] [--level LVL] [--force]");
      process.exit(0);
    }
  }
  return args;
}

// ── Pool I/O ─────────────────────────────────────────────────────────
function loadPool(): Card[] {
  if (!existsSync(OUTPUT_PATH)) return [];
  try {
    const text = readFileSync(OUTPUT_PATH, "utf-8");
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Failed to read existing pool, starting fresh:", err);
    return [];
  }
}

function savePool(pool: Card[]) {
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(pool, null, 2));
}

// ── Pretty-progress logging ──────────────────────────────────────────
function ts(): string {
  return new Date().toISOString().slice(11, 19);
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`[${ts()}] FinScroll card pre-generator`);
  console.log(`        delay=${args.delay}ms, level=${args.level ?? "all"}, force=${args.force}`);

  // 1. Decide which seeds to generate
  const candidates = args.level
    ? CONCEPT_SEEDS.filter((s) => s.level === args.level)
    : CONCEPT_SEEDS;

  const pool = loadPool();
  const existingIds = new Set(pool.map((c) => String(c.id)));

  const todo = candidates.filter((seed) => {
    if (args.force) return true;
    // GeneratedCard.id format is `gen-<seedId>`; the learn-feed adapter
    // preserves that, so we match against existing pool ids accordingly.
    return !existingIds.has(`gen-${seed.id}`);
  });

  const capped = args.max ? todo.slice(0, args.max) : todo;

  console.log(`        ${candidates.length} candidate seed(s), ${pool.length} already in pool, ${capped.length} to generate`);

  if (capped.length === 0) {
    console.log(`[${ts()}] Nothing to do. Pool is up to date.`);
    return;
  }

  // 2. Generate sequentially with delay between calls
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < capped.length; i++) {
    const seed = capped[i];
    console.log(`[${ts()}] (${i + 1}/${capped.length}) Generating "${seed.id}" (${seed.level} · ${seed.topic})…`);

    try {
      const generated = await generateCardFromSeed(seed);
      if (!generated) {
        console.warn(`[${ts()}]   ✗ Generation returned null`);
        failCount++;
      } else {
        const card = toLearnCard(generated);
        // If --force replaced an existing entry, swap it out instead of duplicating
        const existingIdx = pool.findIndex((c) => String(c.id) === String(card.id));
        if (existingIdx >= 0) pool[existingIdx] = card;
        else pool.push(card);
        savePool(pool);
        successCount++;
        console.log(`[${ts()}]   ✓ "${card.title}" → saved (pool: ${pool.length})`);
      }
    } catch (err) {
      failCount++;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[${ts()}]   ✗ ${message}`);
      // Most likely cause is a Gemini 429. Pause longer to give the quota
      // window a chance to roll over before we move on.
      if (message.includes("429")) {
        console.warn(`[${ts()}]   Quota likely exhausted — sleeping 60s before continuing`);
        await sleep(60_000);
      }
    }

    // Delay before next request — skip on the very last iteration
    if (i < capped.length - 1) await sleep(args.delay);
  }

  console.log(`[${ts()}] Done. ${successCount} generated, ${failCount} failed. Pool now has ${pool.length} card(s).`);
  if (failCount > 0) {
    console.log(`        Rerun the same command to retry failed seeds — successful cards are already saved.`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
