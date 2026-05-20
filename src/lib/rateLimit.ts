interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store — resets on server restart. Sufficient for demo/competition.
// Replace with Upstash Redis for production multi-instance deployments.
const store = new Map<string, RateLimitEntry>();

export function rateLimit(
  identifier: string,
  limit = 20,
  windowMs = 60_000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const existing = store.get(identifier);

  if (!existing || now > existing.resetTime) {
    store.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetIn: windowMs };
  }

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

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
