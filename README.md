# FinScroll

> **Stop Doomscrolling. Start Wealth-Building.**

FinScroll turns the doomscrolling habit into financial literacy.
TikTok-style vertical scroll cards — every fact grounded in SEC publications and peer-reviewed academic research, not 22-year-olds in Lamborghinis.

**Live demo:** _add your deployed URL here_
**Built for:** Google for Developers · #JuaraVibeCoding

---

## The Problem

Gen-Z spends **6.5 hours/day** scrolling content that makes them poorer:

- They get financial advice from TikTok influencers promoting meme stocks, leveraged crypto, and day trading schemes
- **95% of day traders lose money** (SEC data)
- The time itself has an opportunity cost — money never invested, never compounded

No existing product directly connects the doomscrolling habit to its real financial cost AND teaches alternatives in the same scroll format younger users actually engage with.

---

## The Solution

FinScroll intercepts the habit loop. Same addictive vertical scroll mechanics that trap users — but every card teaches a real, sourced financial concept, with a quick knowledge check that builds streaks and unlocks compound learning.

### Five learning surfaces

| Surface | What it does |
|---|---|
| **FinTok Feed** | 12 curated + dynamically RAG-generated cards covering Beginner → Quant levels. Quizzes, streaks, source citations. |
| **Roast Mode** | 24-myth library across 5 categories (Crypto Hype, Day Trading, Passive Income, Market Timing, Speculation) with severity ratings. AI roasts user-submitted claims with grounded citations. |
| **Wealth Calculator** | Sliders for daily scroll hours + savings rate. Visualizes 10/30-year compound projections across HYSA, S&P 500, and Tech Growth portfolios. |
| **AI Coach** | RAG chatbot with Gen-Z tone. Every answer grounded in Pinecone vector search over SEC + Springer Nature data. No hallucinations. |
| **Stats** | Streak hero, weekly challenge ("Master 5 concepts this week"), share card with native Web Share API. |

### How the AI works

```
User concept → Pinecone semantic search (top 3 chunks)
            → Gemini 2.5 Flash with structured JSON prompt
            → Zod schema validation
            → Cached, rendered as a TikTok-style card
```

Cards are **never** rendered without passing Zod validation against the strict schema. Hallucinated or malformed responses are silently discarded — never shown to users.

---

## Judging criteria alignment

### Problem (30%)

- **Real and urgent**: Gen-Z financial literacy is a $127k/person opportunity-cost crisis according to compound math
- **Target audience explicitly defined**: 18–26, mobile-native, doomscrolling 3–6 hr/day, distrustful of legacy finance
- **Impact potential**: Behavior-change framework that scales — every user who breaks the loop saves themselves measurable dollars

### Solution (40%)

- **Functional**: Full sign-up → onboarding → learning → quiz → streak → share flow works end-to-end
- **Professional**: Strict TypeScript, Zod-validated APIs, security-headered, rate-limited, PWA-installable
- **Easy to use**: Mobile-first 390px viewport, bottom-nav navigation, no jargon without explanation
- **Delightful UX**: Session nudges at 5/15/30/60-min milestones, level-progressive feed, science-vs-finfluencer split cards
- **Measurable value**: Opportunity-cost calculator quantifies each user's specific wealth gap

### Uniqueness (30%)

- **Original concept**: First app that uses TikTok's own scroll mechanics against the doomscrolling habit
- **Elegant AI use**: Gemini-grounded RAG over SEC/Springer Nature data, not generic prompting
- **Out-of-the-box features**: Finfluencer Roast Mode with severity ratings, live scroll-cost counter ticking on landing page, in-session wealth-protected nudges

---

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 |
| Auth | Clerk |
| LLM | Google Gemini 2.5 Flash |
| Vector DB | Pinecone (3072-dim embeddings) |
| RAG orchestration | LangChain Core |
| Persistence | Supabase Postgres (with localStorage fallback) |
| PWA | Web App Manifest + Service Worker |
| Validation | Zod |

---

## Architecture highlights

### Security

- **Strict CORS** — origin pinned (not wildcard) when credentials enabled
- **Security headers** — X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS
- **Auth enforcement** — Clerk middleware protects every app route + write API. API failures return JSON 401, not HTML redirects.
- **Rate limiting** — Per-IP and per-user limits on all expensive endpoints
- **Prompt-injection sanitization** — 19-pattern filter on all user input passed to LLM prompts
- **Zod validation** — Every API request body validated against strict schemas, including LLM responses
- **Service role isolation** — Supabase service-role key is server-only; never imported by client components

### PWA

- Installable from Android Chrome, iOS Safari, desktop Chromium browsers
- Service worker: cache-first for static assets, network-first for navigation, never caches API
- Branded offline fallback page

### Cross-device sync

Per-user state (onboarding, streaks, completed cards, weekly log) syncs to Supabase Postgres when configured. If unset, app continues working in localStorage-only mode — zero feature loss, graceful degradation.

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.local.example .env.local   # if this file exists, otherwise create
# Required:
#   PINECONE_API_KEY=
#   PINECONE_INDEX=
#   GOOGLE_GEMINI_API_KEY=
#   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
#   CLERK_SECRET_KEY=
# Optional (cross-device sync):
#   SUPABASE_URL=
#   SUPABASE_SERVICE_ROLE_KEY=

# 3. Seed the Pinecone index (one-time)
npx tsx --env-file=.env.local seed.ts

# 4. (Optional) Set up Supabase
# Create a project at supabase.com, run supabase/schema.sql in the SQL editor

# 5. Start the dev server
npm run dev
```

Open `http://localhost:3000` to see the app.

---

## Project structure

```
src/
├── app/
│   ├── (app)/              Protected app routes (Clerk-gated)
│   │   ├── feed/           FinTok scroll feed
│   │   ├── roast/          Finfluencer Roast Mode
│   │   ├── calculate/      Wealth Calculator
│   │   ├── chat/           AI Coach
│   │   └── stats/          Streak + share + weekly challenge
│   ├── api/
│   │   ├── chat/           RAG-grounded chat endpoint
│   │   ├── cards/          Dynamic card generator
│   │   ├── search/         Semantic search
│   │   ├── me/state/       Cross-device sync
│   │   └── ...
│   ├── sign-in/sign-up/    Clerk auth pages
│   └── page.tsx            Landing page (auth-redirected to /feed)
├── components/             React components
├── lib/                    Pure utilities (Zod, Pinecone, Gemini, sync)
├── services/               Business logic (chat, cards, search, ingestion)
└── proxy.ts                Clerk middleware (Next.js 16 convention)

supabase/schema.sql         DDL for the user_onboarding + user_progress tables
public/                     Manifest, service worker, icons, offline page
```

---

## Roadmap completed

Every feature in the original PRD is shipped:

- [x] Mobile-first responsive UI (390px primary)
- [x] Clerk authentication
- [x] 3-step onboarding flow with personalized feed start
- [x] 12 curated + Pinecone-driven dynamic cards
- [x] In-session scroll-cost nudge banners
- [x] 24-myth Finfluencer Roast Mode
- [x] PWA install + offline support
- [x] Stats dashboard with shareable streak card
- [x] Supabase cross-device sync (graceful localStorage fallback)

---

## License

Educational and competition demonstration use only.
Not financial advice. Always consult a licensed financial advisor before making investment decisions.
