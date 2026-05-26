# FinScroll — case study

**One-line summary:** A worldwide-targeted financial-literacy PWA for younger users that turns the doomscrolling habit into compound-interest learning. RAG-grounded cards, three-tier LLM fallback, distributed rate limiting on free-tier infrastructure.

**Stack:** Next.js 16 · Clerk · Pinecone · Gemini · Supabase · Upstash Redis · Vercel
**Live:** https://fin-scroll.vercel.app
**Code:** https://github.com/halim-franky/FinScroll
**Time investment:** ~4 weeks of iterative development

---

## The problem I wanted to solve

Younger users worldwide get their financial advice from short-form-video finfluencers — meme-stock pumpers, leveraged-crypto bros, day-trading "courses." The U.S. SEC reports that **95% of day traders lose money** (the same pattern is documented in UK FCA, Australian ASIC, and EU ESMA retail-investor reports), and 16-to-24-year-olds globally scroll **~6 hours a day on average** across short-form-video platforms. The scroll itself has a measurable opportunity cost: every hour spent on Instagram Reels is an hour of compound interest never earned.

This is a global problem, not a US-specific one. TikTok and Reels have over a billion monthly active users; the same finfluencer archetypes, the same compound-interest gap, the same speculation-encouraging "side hustle" framing appears in essentially every market with mass-market smartphones.

I couldn't find a single product that:

1. **Connects the doomscrolling habit to its real financial cost** (most apps moralize, none quantify)
2. **Teaches alternatives in the same scroll format users already engage with** (most finance apps look like spreadsheets)
3. **Grounds its claims in real research** (most are either generic blog content or AI hallucinations)

So I built one.

---

## Design hypothesis

Same habit loop. Different content.

TikTok works because of three mechanics:

- **Vertical scroll-snap** — finger-flick rewards
- **Variable-length content** (5-15 sec per video) — unpredictable timing keeps dopamine firing
- **Streaks + social signals** — fear-of-missing-out

I kept all three, swapped the content for finance, and added two new mechanics:

- **Live opportunity-cost ticker** on the landing page (visible cost in dollars while you scroll)
- **Story 5-frame cards** (Video → Visual → Insight → Quiz → Proof) — each card breaks one financial concept into 5 micro-frames, like an Instagram Story

The hypothesis: if you redirect the *same* scroll behavior toward grounded financial content, with the *same* feedback signals, you can change the outcome without asking the user to change the behavior.

---

## What's actually built

| Surface | What it does |
|---|---|
| **Learn (FinScroll)** | 33+ cards across Beginner→Quant levels. 12 hand-written + 20 RAG-pre-generated + 1 daily drop. Inline YouTube embeds for 18 of them. Each card is a 5-frame story you advance with a tap. |
| **AI Coach** | RAG chatbot over Pinecone (SEC + Springer Nature) + a curated peer-reviewed reference library. Can take card context from the Learn feed ("Ask Coach about this concept" CTA). |
| **Roast Mode** | 24-myth library across 5 categories with severity ratings; AI roasts user-submitted finfluencer claims with grounded citations. |
| **Stats** | Streak hero + concepts-mastered counter + weekly log + shareable PNG streak card (Web Share API, falls back to download). |

---

## Three engineering decisions worth talking about

### 1. Three-tier Gemini fallback ladder

**The problem:** Card generation calls Gemini. Gemini's free tier on the newest model (`gemini-3-flash-preview`) is roughly **25 RPD** — *requests per day*. A single offline regeneration of 20 cards exhausts more than half a day's quota in one shot.

**The naive solution:** Catch 429, retry later. Bad UX, doesn't fix the underlying ceiling.

**What I built:** A model-ladder helper (`src/lib/geminiFallback.ts`) that cycles through three models on any transient failure:

```
gemini-3-flash-preview    (25-100 RPD, best quality)
       ↓ on 429 / 5xx / JSON parse failure
gemini-2.5-flash-lite     (~1,000 RPD)
       ↓ on 429 / 5xx
gemini-2.0-flash          (~1,500 RPD, most stable)
       ↓ on 429
ALL EXHAUSTED — return 503 with `fallback: true`
```

The fallback fires on three distinct failure modes:
- **429** (quota exhausted) — expected during peak hours
- **5xx** (model unavailable) — Gemini frequently returns 503 "high demand" on preview models
- **JSON parse error** (truncated output) — when the model burns its token budget on internal "thinking" and the response is malformed

**Result during the actual offline pool generation:** 12 of 20 cards failed on the primary model. Every single one was recovered by the fallback. The user-visible card pool came out 100% successful from what would otherwise have been a 40% success rate.

**Cost of the abstraction:** ~50 lines of code in one file. Re-used by both card generation and the chat endpoint.

---

### 2. Three-layer card cache (Redis → Supabase → Gemini)

**The problem:** Every card request that misses cache costs:
- ~3 seconds of latency
- One Gemini call against my daily quota
- Variable output quality (LLM non-determinism)

Caching is mandatory. But on Vercel serverless, **in-process caches reset on every cold start** — fine for a CDN, useless for shared state.

**What I built:** A two-tier persistent cache with a third LLM-generation tier as fallback.

| Tier | Storage | Latency | Sharing |
|---|---|---|---|
| L1 | Upstash Redis | ~2 ms | Across all Vercel instances + local dev |
| L2 | Supabase Postgres `generated_cards` table | ~50 ms | Same |
| L3 | Gemini (last resort) | ~3 s | Per call |

Card requests flow L1 → L2 → L3, warming each layer on the way back. The card generator transparently writes to both persistent layers when L3 fires, so the next caller across **any** layer hits warm. Same flow used by `/api/cards/generate`, `/api/cards/daily`, and the daily Vercel cron.

**A subtle self-healing detail I'm proud of:** When the curated `videoEmbedUrl` for a concept changes in `conceptSeeds.ts`, I don't want to invalidate the entire cache. So the lookup *always* re-attaches the seed's current `videoEmbedUrl` and `videoCreator` onto whatever cached card it returns. The card body stays cached (saves the LLM call), but video URLs update immediately. Three lines of code, zero migration headaches.

**Test verification:** I wrote a functional test (`npm run test:redis`) that hits both layers in sequence, asserts Redis writes are visible from a direct client, asserts TTL expiry actually frees the key, and cleans up after itself. 13/13 pass.

---

### 3. Distributed rate limiter with in-memory fallback

**The problem:** The original rate limiter used a `Map<string, Counter>` in-process. Two failure modes:

- **Cold starts reset the map.** A determined user could refresh until a new serverless instance picked them up, bypassing the limit
- **Multiple Vercel instances don't share counters.** A 10/min limit becomes 30/min across three concurrently-warm instances

**What I built:** Same public API (`rateLimit(id, limit, windowMs) → Promise<RateLimitResult>`), two backends:

```
if UPSTASH_REDIS_REST_URL set:
   atomic INCR + PEXPIRE in Redis (distributed, durable)
else:
   in-memory Map with LRU eviction (single-instance, local-dev-friendly)
```

The Redis path uses a fixed-window counter (INCR is atomic; first hit sets PEXPIRE; subsequent hits read PTTL for the Retry-After header). The Map path uses the original logic.

**Why fail-open on Redis errors:** If Upstash hiccups mid-request, the rate limiter falls back to in-memory and logs a warning. Better UX than locking out legitimate users for a transient cache layer error.

**Verification on production:** After deploying, I ran 3 sequential `/api/contact` POSTs from my local machine against the live Vercel URL. The Upstash dashboard showed three keys:

- `rl:contact:182.8.66.217` (my public IP — counter from the Vercel serverless function)
- `rl:contact:::1` (localhost IPv6 — counter from my local dev server hitting the same Redis)
- `rl:__global:contact_form` (shared bucket — *both* environments incremented it)

That last one is the key proof: state was actually shared across environments, not just locally cached.

---

## What I'd do next

In rough priority order:

1. **Migrate Clerk to production keys** (requires custom domain). Removes the dev-mode handshake redirect that's pinning Lighthouse Performance at 67. Estimated bump to ~90.
2. **Pre-generate cards via Vercel cron, not just on-demand.** The daily cron already runs — extending it to backfill missing seeds would mean the on-demand path is rarely needed.
3. **Add a streaming-mode AI Coach** with React Server Components + Suspense for token-by-token rendering. Current implementation buffers the full response.
4. **A11y audit beyond the auto Lighthouse pass.** I've manually addressed contrast and keyboard nav but haven't run axe-core against every modal.
5. **Real user analytics.** Right now I have Sentry for errors but no engagement metrics — would add PostHog for funnel + retention analysis once there's traffic.

---

## What I learned

**1. Free-tier engineering is a real skill.** Three engineering decisions in this project (fallback ladder, dual cache, in-memory fallback) exist *specifically* to keep monthly cost at $0 without sacrificing user-visible reliability. That constraint shaped the architecture more than any feature requirement.

**2. Graceful degradation is more useful than five-nines uptime.** Every external service in FinScroll has a fallback: Redis → in-memory, Supabase → localStorage, Gemini-3 → 2.5 → 2.0, Resend → log, Sentry → no-op. The system isn't fault-tolerant in the traditional sense, it's *gracefully degrading* — each layer can disappear and the app keeps working.

**3. The hardest part of an AI app is the not-AI parts.** RAG + Gemini is the easy half. The hard half is: serving the response in 3 seconds instead of 30, caching across instances, validating LLM output, rate-limiting the right way, refreshing data without cache invalidation pain, and shipping a UI that doesn't ship as 5 MB of JavaScript.

---

## Stack at a glance

- **Frontend:** Next.js 16 (App Router, Turbopack), React 19, TypeScript strict, Tailwind v4
- **Auth:** Clerk (dev keys for portfolio demo)
- **AI:** Google Gemini (3-flash-preview / 2.5-flash-lite / 2.0-flash fallback ladder), Pinecone (3072-dim embeddings)
- **Data:** Supabase Postgres (user state + L2 card cache), Upstash Redis (rate limit + L1 card cache)
- **Infrastructure:** Vercel (Hobby tier, daily cron, serverless functions)
- **Observability:** Sentry (errors), structured server logs (cache + fallback decisions)
- **Validation:** Zod everywhere (`.strict()`), Resend (contact form) with email-header injection guards

All of the above runs at **$0/month** at portfolio scale.
