/**
 * Gemini fallback ladder.
 *
 * Both the AI Coach (chat.ts) and the card generator (cardGenerator.ts)
 * call this so they share the same primary-model + fallback chain.
 *
 * Why a ladder: the newest preview models give the best output quality
 * but have the tightest free-tier quotas. When the primary model
 * 429s ("quota exhausted"), we transparently retry on a model with a
 * much larger free-tier RPD. The user-visible behaviour is identical;
 * server logs note which fallback served the request so we can spot
 * which model is doing the work day-to-day.
 *
 * Ladder order (highest quality → highest availability):
 *
 *   1. gemini-3-flash-preview   ~25–100 RPD   newest, preview
 *   2. gemini-2.5-flash-lite    ~1,000 RPD    quality drop minor (~95%)
 *   3. gemini-2.0-flash         ~1,500 RPD    longest-shipped, most stable
 *
 * If all three exhaust on a single day you've made >2,600 successful
 * Gemini calls — well above any portfolio-scale use case. At that point
 * the right answer is to wait for the daily reset or enable billing.
 */

export const GEMINI_FALLBACK_MODELS = [
  "gemini-3-flash-preview",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
] as const;

export type GeminiBody = {
  contents: Array<{ parts: Array<{ text: string }> }>;
  generationConfig?: Record<string, unknown>;
};

export interface GeminiCallResult {
  /** Parsed JSON from the API. Caller is responsible for extracting `candidates[0]…`. */
  data: unknown;
  /** Which model in the ladder actually served the response. */
  modelUsed: string;
}

/**
 * Call Gemini with automatic fallback on 429.
 *
 * Non-429 errors (network, malformed body, 4xx other than 429, 5xx) bubble
 * up immediately on the first failing model — fallback is *only* for
 * quota issues, not general API failures.
 */
export async function callGeminiWithFallback(
  body: GeminiBody,
  apiKey: string,
  options: {
    /** Tag for log lines so different callers are distinguishable. */
    callerTag?: string;
    /** Override the default ladder for testing or one-off needs. */
    models?: readonly string[];
  } = {},
): Promise<GeminiCallResult> {
  const models = options.models ?? GEMINI_FALLBACK_MODELS;
  const tag = options.callerTag ?? "gemini";

  let lastQuotaError: Error | null = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const isLast = i === models.length - 1;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // Transient model issues → try next ladder rung. We treat the
    // following as fallback-worthy:
    //   • 429 — quota exhausted
    //   • 5xx — model overload, server flake, gateway timeout. Gemini
    //     preview models in particular return 503 "high demand" during
    //     peak hours; cascading to a more stable model fixes that.
    // Non-fallback errors (4xx other than 429) bubble up immediately
    // because they indicate a client mistake — same call won't succeed
    // on a different model.
    const isTransient = response.status === 429 || response.status >= 500;
    if (isTransient) {
      const errBody = await response.text();
      const tagReason = response.status === 429 ? "quota exhausted" : `transient ${response.status}`;
      lastQuotaError = new Error(
        `Gemini ${model} ${response.status} (${tagReason}): ${errBody.slice(0, 200)}`,
      );
      if (isLast) {
        // All rungs exhausted — bubble the last error up
        throw lastQuotaError;
      }
      console.warn(
        `[${tag}] ${model} ${tagReason}, falling back to ${models[i + 1]}…`,
      );
      continue;
    }

    // Any other failure is a client error (4xx other than 429) —
    // surface it immediately, fallback won't help
    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(
        `Gemini ${model} error ${response.status}: ${errBody.slice(0, 200)}`,
      );
    }

    const data = await response.json();

    // Log when we successfully used a fallback so it's easy to spot in
    // logs that the primary is rate-limited.
    if (i > 0) {
      console.log(`[${tag}] ✓ Fallback model "${model}" served the request`);
    }

    return { data, modelUsed: model };
  }

  // Unreachable — the for-loop either returns or throws above. Belt-and-
  // braces in case the model list is empty.
  throw lastQuotaError ?? new Error(`[${tag}] no models configured`);
}
