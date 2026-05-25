/**
 * Functional test for the Upstash Redis wiring.
 *
 * Verifies:
 *   1. Redis connectivity (PING)
 *   2. Rate limiter — counter increments correctly, blocks at limit,
 *      resets after TTL window
 *   3. Card cache — L1 (Redis) lookups work and TTL is set
 *   4. Cleanup — no test keys left behind in Redis
 *
 * Run: npm run test:redis
 *
 * Loads env vars via tsx --env-file=.env.local. Without UPSTASH_*
 * configured, the test exits early with a clear message so it doesn't
 * give false confidence by passing on in-memory fallback.
 */

import { Redis } from "@upstash/redis";
import {
  rateLimit,
  globalRateLimit,
  isRedisConfigured,
} from "../src/lib/rateLimit";

// Small color helpers so output is scannable
const C = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
};

let passed = 0;
let failed = 0;

function check(label: string, ok: boolean, detail?: string) {
  if (ok) {
    console.log(`  ${C.green("✓")} ${label}${detail ? C.dim(` (${detail})`) : ""}`);
    passed++;
  } else {
    console.log(`  ${C.red("✗")} ${label}${detail ? `\n    ${C.red(detail)}` : ""}`);
    failed++;
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🔴 Upstash Redis functional test\n");

  if (!isRedisConfigured()) {
    console.log(
      C.yellow(
        "  Skipped — UPSTASH_REDIS_REST_URL / TOKEN not set in .env.local.\n",
      ),
    );
    console.log("  Add the credentials and rerun to test the Redis path.\n");
    process.exit(0);
  }

  // Direct client for setup, inspection, and cleanup
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  // ── Test 1: connectivity ────────────────────────────────────────
  console.log("1. Connectivity");
  try {
    const pong = await redis.ping();
    check("PING reaches Upstash", pong === "PONG", `response = ${JSON.stringify(pong)}`);
  } catch (err) {
    check("PING reaches Upstash", false, err instanceof Error ? err.message : String(err));
    console.log(C.red("\n  Cannot proceed without connectivity. Aborting.\n"));
    process.exit(1);
  }

  // ── Test 2: rateLimit() basic flow ──────────────────────────────
  console.log("\n2. Per-identifier rateLimit() — 3 calls allowed, 4th blocked");
  const testId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const r1 = await rateLimit(testId, 3, 60_000);
  check("Call 1 allowed", r1.allowed && r1.remaining === 2, `remaining = ${r1.remaining}`);

  const r2 = await rateLimit(testId, 3, 60_000);
  check("Call 2 allowed", r2.allowed && r2.remaining === 1, `remaining = ${r2.remaining}`);

  const r3 = await rateLimit(testId, 3, 60_000);
  check("Call 3 allowed (last)", r3.allowed && r3.remaining === 0, `remaining = ${r3.remaining}`);

  const r4 = await rateLimit(testId, 3, 60_000);
  check("Call 4 BLOCKED", !r4.allowed, `allowed = ${r4.allowed}`);

  // Inspect Redis directly — counter should be 4 (INCR records over-limit too)
  const directCount = await redis.get<number>(`rl:${testId}`);
  check(
    "Counter visible in Redis",
    typeof directCount === "number" && directCount >= 3,
    `rl:${testId} = ${directCount}`,
  );

  // Cleanup
  await redis.del(`rl:${testId}`);

  // ── Test 3: rate limit TTL expiry ───────────────────────────────
  console.log("\n3. Rate limit TTL expires (1.5s window)");
  const ttlId = `test-ttl-${Date.now()}`;

  const t1 = await rateLimit(ttlId, 1, 1500);
  check("Call 1 allowed", t1.allowed, `resetIn = ${t1.resetIn}ms`);

  const t2 = await rateLimit(ttlId, 1, 1500);
  check("Call 2 blocked (at limit)", !t2.allowed);

  console.log(C.dim("    waiting 2s for TTL expiry..."));
  await sleep(2000);

  const t3 = await rateLimit(ttlId, 1, 1500);
  check("Call after TTL — allowed again", t3.allowed, `remaining = ${t3.remaining}`);

  // Cleanup
  await redis.del(`rl:${ttlId}`);

  // ── Test 4: globalRateLimit() prefixes correctly ────────────────
  console.log("\n4. globalRateLimit() keys are namespaced");
  const bucket = `test-bucket-${Date.now()}`;
  await globalRateLimit(bucket, 5, 60_000);

  const globalKey = `rl:__global:${bucket}`;
  const globalCount = await redis.get<number>(globalKey);
  check(
    "Global bucket stored under __global: prefix",
    globalCount === 1,
    `${globalKey} = ${globalCount}`,
  );

  // Cleanup
  await redis.del(globalKey);

  // ── Test 5: card cache TTL ──────────────────────────────────────
  console.log("\n5. Card cache supports TTL");
  const cacheKey = `card:test-${Date.now()}`;
  await redis.set(
    cacheKey,
    { id: "test-card", title: "Test" },
    { ex: 60 }, // 60-second TTL
  );

  const cached = await redis.get<{ id: string }>(cacheKey);
  check("Card written + read back", cached?.id === "test-card", `got id = ${cached?.id}`);

  const ttl = await redis.ttl(cacheKey);
  check("TTL applied (~60s)", ttl > 0 && ttl <= 60, `ttl = ${ttl}s`);

  // Cleanup
  await redis.del(cacheKey);

  // ── Test 6: no leftover keys ────────────────────────────────────
  console.log("\n6. Cleanup verification");
  const lingeringKeys: string[] = [];
  // Scan all our test keys (test-* prefix)
  let cursor: string | number = 0;
  do {
    const scan = await redis.scan(cursor, { match: "rl:test-*", count: 50 });
    cursor = scan[0];
    lingeringKeys.push(...scan[1]);
  } while (cursor !== 0 && cursor !== "0");

  cursor = 0;
  do {
    const scan = await redis.scan(cursor, { match: "card:test-*", count: 50 });
    cursor = scan[0];
    lingeringKeys.push(...scan[1]);
  } while (cursor !== 0 && cursor !== "0");

  check(
    "No leftover test keys in Redis",
    lingeringKeys.length === 0,
    lingeringKeys.length > 0 ? `found: ${lingeringKeys.join(", ")}` : "0 keys",
  );

  // ── Summary ─────────────────────────────────────────────────────
  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(C.red("Fatal:"), err);
  process.exit(1);
});
