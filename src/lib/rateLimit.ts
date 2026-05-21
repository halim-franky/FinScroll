/**
 * Production-grade in-memory rate limiter.
 *
 * Designed for single-instance deployments (one Node process). For
 * horizontal scaling (Vercel serverless across regions, multiple
 * containers), swap the `store` Map with @upstash/ratelimit + Redis —
 * the public function signatures stay identical, so no caller has to
 * change.
 *
 * Hardening over a naive version:
 *   1. LRU-bounded Map (MAX_ENTRIES) — protects against memory growth
 *      when each unique IP becomes a new key.
 *   2. Periodic sweep of expired entries — bounds memory even further.
 *   3. globalRateLimit() — caps TOTAL traffic on expensive endpoints
 *      (LLM-bound) across all users, protecting API quotas from
 *      coordinated attacks across many IPs.
 *   4. Trusted-header IP detection — prefers Vercel / Cloudflare
 *      framework headers, falls back to x-forwarded-for / cf-ip.
 */

// ── Configuration ───────────────────────────────────────────────────
const MAX_ENTRIES = 10_000;             // cap memory
const SWEEP_INTERVAL_MS = 60_000;       // expire stale entries every minute

// ── Storage ─────────────────────────────────────────────────────────
interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastAccess: number;
}

const store = new Map<string, RateLimitEntry>();

let lastSweep = Date.now();
function sweepIfDue(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, entry] of store) {
    if (entry.resetTime < now) store.delete(key);
  }
  // If still too large after sweep, evict oldest by lastAccess (LRU)
  if (store.size > MAX_ENTRIES) {
    const sorted = Array.from(store.entries()).sort(
      (a, b) => a[1].lastAccess - b[1].lastAccess
    );
    const toEvict = store.size - MAX_ENTRIES;
    for (let i = 0; i < toEvict; i++) store.delete(sorted[i][0]);
  }
}

// ── Per-identifier rate limit (per IP, per user, etc.) ──────────────
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

export function rateLimit(
  identifier: string,
  limit = 20,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  sweepIfDue(now);

  const existing = store.get(identifier);

  if (!existing || now > existing.resetTime) {
    store.set(identifier, { count: 1, resetTime: now + windowMs, lastAccess: now });
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

// ── Global rate limit (shared across ALL callers) ───────────────────
/**
 * Use for endpoints with expensive third-party calls (Gemini, Pinecone)
 * where coordinated multi-IP attacks could exhaust your API quota even
 * if each individual IP stays under its per-IP limit.
 *
 * The identifier here is a logical bucket name (e.g. "llm_chat", "llm_cards").
 */
export function globalRateLimit(
  bucket: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  return rateLimit(`__global:${bucket}`, limit, windowMs);
}

// ── Build a standard 429 response with consistent headers ───────────
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
    }
  );
}

// ── Trusted IP detection ────────────────────────────────────────────
/**
 * Returns the client IP based on framework-trusted headers. Prefers
 * headers set by Vercel / Cloudflare which the platform sets after
 * stripping client-supplied values, so they cannot be spoofed.
 *
 * Falls back to x-forwarded-for for self-hosted setups. When deploying
 * behind a non-standard reverse proxy, ensure that proxy strips
 * client-supplied x-forwarded-for before adding its own.
 */
export function getClientIp(request: Request): string {
  // Vercel: x-vercel-forwarded-for (stripped of client values)
  const vercel = request.headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0].trim();

  // Cloudflare: cf-connecting-ip (single value, set by CF only)
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();

  // Generic fallback: x-real-ip (typical for nginx/traefik)
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();

  // Last resort: x-forwarded-for (assumes upstream proxy is trusted)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
}
