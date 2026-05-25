/**
 * Production-grade rate limiter — Redis-backed, in-memory fallback.
 *
 * Why both:
 *   - Upstash Redis gives us atomic, distributed counters that survive
 *     Vercel cold starts. Each serverless instance shares the same
 *     state, so a determined user can't bypass limits by reconnecting
 *     to a different instance.
 *   - When UPSTASH_REDIS_REST_URL is not configured (local dev, or any
 *     misconfiguration), we fall back to an in-memory Map. Same API
 *     surface, just non-shared state.
 *
 * The Map keeps the original LRU + sweep logic for memory safety; the
 * Redis path uses INCR + PEXPIRE for a fixed-window counter — cheaper
 * than a sliding window and good enough for portfolio-scale traffic.
 *
 * All public functions are now `async` because Redis is fundamentally
 * async. Callers must `await` them.
 */

import { Redis } from "@upstash/redis";

// ── Storage ─────────────────────────────────────────────────────────
interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastAccess: number;
}

const memStore = new Map<string, RateLimitEntry>();

// ── Upstash client (singleton, cached by module scope) ──────────────
let redisClient: Redis | null | undefined;
function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token || url.includes("YOUR_") || token.includes("YOUR_")) {
    redisClient = null;
    return null;
  }

  try {
    redisClient = new Redis({ url, token });
  } catch (err) {
    console.warn("[rateLimit] Upstash Redis init failed:", err);
    redisClient = null;
  }
  return redisClient;
}

export function isRedisConfigured(): boolean {
  return getRedis() !== null;
}

// ── Configuration ──────────────────────────────────────────────────
const MAX_ENTRIES = 10_000;
const SWEEP_INTERVAL_MS = 60_000;

let lastSweep = Date.now();
function sweepIfDue(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, entry] of memStore) {
    if (entry.resetTime < now) memStore.delete(key);
  }
  if (memStore.size > MAX_ENTRIES) {
    const sorted = Array.from(memStore.entries()).sort(
      (a, b) => a[1].lastAccess - b[1].lastAccess,
    );
    const toEvict = memStore.size - MAX_ENTRIES;
    for (let i = 0; i < toEvict; i++) memStore.delete(sorted[i][0]);
  }
}

// ── Public types ──────────────────────────────────────────────────
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

// ── In-memory rate limit (fallback path) ──────────────────────────
function rateLimitInMemory(
  identifier: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweepIfDue(now);

  const existing = memStore.get(identifier);

  if (!existing || now > existing.resetTime) {
    memStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
      lastAccess: now,
    });
    return { allowed: true, remaining: limit - 1, resetIn: windowMs };
  }

  existing.lastAccess = now;

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: existing.resetTime - now,
    };
  }

  existing.count++;
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetIn: existing.resetTime - now,
  };
}

// ── Redis rate limit (primary path) ───────────────────────────────
async function rateLimitInRedis(
  redis: Redis,
  identifier: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  // Namespace the key so accidental collisions with other Redis users
  // (or unrelated app keys) can't happen.
  const key = `rl:${identifier}`;

  // INCR returns the new count after incrementing. If the key didn't
  // exist, Redis creates it at 0 then increments to 1.
  const count = await redis.incr(key);

  // First hit in the window — set TTL so the key expires automatically.
  // This is the "fixed window" pattern: simpler than sliding window and
  // good enough for our limits.
  if (count === 1) {
    await redis.pexpire(key, windowMs);
    return { allowed: true, remaining: limit - 1, resetIn: windowMs };
  }

  // Get remaining TTL for the Retry-After header
  const ttl = await redis.pttl(key);
  // pttl returns -1 if key has no expire, -2 if key doesn't exist.
  // Either case suggests a race condition — fall back to windowMs.
  const resetIn = ttl > 0 ? ttl : windowMs;

  if (count > limit) {
    return { allowed: false, remaining: 0, resetIn };
  }

  return { allowed: true, remaining: limit - count, resetIn };
}

// ── Per-identifier rate limit ─────────────────────────────────────
export async function rateLimit(
  identifier: string,
  limit = 20,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  const redis = getRedis();
  if (!redis) return rateLimitInMemory(identifier, limit, windowMs);

  try {
    return await rateLimitInRedis(redis, identifier, limit, windowMs);
  } catch (err) {
    // Fail OPEN on Redis errors — better UX than locking out users when
    // the cache layer hiccups. Caller still gets a result but we log
    // so the operator can spot persistent issues.
    console.warn("[rateLimit] Redis failure, falling through:", err);
    return rateLimitInMemory(identifier, limit, windowMs);
  }
}

// ── Global rate limit (shared bucket) ─────────────────────────────
export async function globalRateLimit(
  bucket: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  return rateLimit(`__global:${bucket}`, limit, windowMs);
}

// ── Standard 429 response ─────────────────────────────────────────
export function rateLimitResponse(result: RateLimitResult, message?: string) {
  const retryAfter = Math.ceil(result.resetIn / 1000);
  return new Response(
    JSON.stringify({
      error: message ?? "Too many requests. Please wait before trying again.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    },
  );
}

// ── Trusted IP detection (unchanged) ──────────────────────────────
export function getClientIp(request: Request): string {
  const vercel = request.headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0].trim();

  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();

  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
}
