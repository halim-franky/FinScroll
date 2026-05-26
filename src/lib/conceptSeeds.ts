/**
 * Financial concept seeds for dynamic FinScroll card generation.
 *
 * Each seed names a single, well-bounded financial concept that the
 * card generator will research via Pinecone semantic search and
 * synthesize into a TikTok-style learning card.
 *
 * Keep concept names specific and search-friendly — generic phrases
 * like "investing" produce vague output.
 */

export type Level = "Beginner" | "Intermediate" | "Advanced" | "Quant";

export interface ConceptSeed {
  id: string;
  concept: string;
  level: Level;
  topic: string;
  gradient: string;
  /** Pre-curated YouTube embed URL (https://www.youtube.com/embed/VIDEO_ID).
   *  Trusted manual selection — we don't ask the LLM to produce these
   *  because hallucinated video IDs would break the iframe at runtime. */
  videoEmbedUrl?: string;
  /** Human-readable creator name shown in the "Curated by FinScroll ·
   *  sourced from {videoCreator} on YouTube" footer below the player. */
  videoCreator?: string;
}

export const CONCEPT_SEEDS: readonly ConceptSeed[] = [
  // ── Beginner ──────────────────────────────────────────────────────────
  {
    id: "pay-yourself-first",
    concept: "Pay yourself first — automated savings principle",
    level: "Beginner",
    topic: "Saving Habits",
    gradient: "from-emerald-700 via-emerald-950 to-zinc-950",
    videoEmbedUrl: "https://www.youtube.com/embed/k-RTEIaYvAg",
    videoCreator: "Khan Academy",
  },
  {
    id: "sinking-funds",
    concept: "Sinking funds — saving systematically for irregular expenses",
    level: "Beginner",
    topic: "Budgeting",
    gradient: "from-teal-700 via-teal-950 to-zinc-950",
    videoEmbedUrl: "https://www.youtube.com/embed/TcSmd2lmc7E",
    videoCreator: "The Budget Mom",
  },
  {
    id: "credit-score-basics",
    concept: "Credit score components and how to improve them",
    level: "Beginner",
    topic: "Credit",
    gradient: "from-green-700 via-emerald-950 to-zinc-950",
    videoEmbedUrl: "https://www.youtube.com/embed/T5UHXCrW0gI",
    videoCreator: "Practical Personal Finance",
  },
  {
    id: "401k-match",
    concept: "401(k) employer match — why it's free money",
    level: "Beginner",
    topic: "Retirement",
    gradient: "from-lime-700 via-emerald-950 to-zinc-950",
    videoEmbedUrl: "https://www.youtube.com/embed/nFWljN551dM",
    videoCreator: "Finance for Investors",
  },
  {
    id: "term-life-insurance",
    concept: "Term life insurance vs whole life — which makes financial sense",
    level: "Beginner",
    topic: "Insurance",
    gradient: "from-emerald-800 via-teal-950 to-zinc-950",
    videoEmbedUrl: "https://www.youtube.com/embed/yTN5GmyNUAI",
    videoCreator: "The Money Guy Show",
  },

  // ── Intermediate ─────────────────────────────────────────────────────
  {
    id: "hsa-triple-tax",
    concept: "Health Savings Account triple tax advantage",
    level: "Intermediate",
    topic: "Tax-Advantaged Accounts",
    gradient: "from-sky-700 via-sky-950 to-zinc-950",
    videoEmbedUrl: "https://www.youtube.com/embed/K2K77UFkGM8",
    videoCreator: "The Money Guy Show",
  },
  {
    id: "asset-location",
    concept: "Asset location — placing investments in optimal account types",
    level: "Intermediate",
    topic: "Tax Optimization",
    gradient: "from-cyan-700 via-sky-950 to-zinc-950",
    videoEmbedUrl: "https://www.youtube.com/embed/ciW1kM6cX4c",
    videoCreator: "Ben Felix",
  },
  {
    id: "portfolio-rebalancing",
    concept: "Portfolio rebalancing — why and how to do it",
    level: "Intermediate",
    topic: "Portfolio Management",
    gradient: "from-blue-700 via-sky-950 to-zinc-950",
    videoEmbedUrl: "https://www.youtube.com/embed/-82wfugD1fc",
    videoCreator: "Vanguard",
  },
  {
    id: "backdoor-roth",
    concept: "Backdoor Roth IRA conversion strategy for high earners",
    level: "Intermediate",
    topic: "Retirement Tax Strategy",
    gradient: "from-indigo-700 via-sky-950 to-zinc-950",
    videoEmbedUrl: "https://www.youtube.com/embed/IbDEHci_oQo",
    videoCreator: "Mark J. Kohler",
  },
  {
    id: "expense-ratios",
    concept: "Expense ratios — how small fees compound to massive losses",
    level: "Intermediate",
    topic: "Fund Selection",
    gradient: "from-sky-800 via-blue-950 to-zinc-950",
    videoEmbedUrl: "https://www.youtube.com/embed/9pJhiAbdjvo",
    videoCreator: "The Plain Bagel",
  },

  // ── Advanced ─────────────────────────────────────────────────────────
  {
    id: "tax-loss-harvesting",
    concept: "Tax-loss harvesting — turning losses into tax savings",
    level: "Advanced",
    topic: "Tax Strategy",
    gradient: "from-violet-700 via-violet-950 to-zinc-950",
    videoEmbedUrl: "https://www.youtube.com/embed/N3FE6xuU7gY",
    videoCreator: "Tae Kim",
  },
  {
    id: "risk-parity",
    concept: "Risk parity portfolio construction",
    level: "Advanced",
    topic: "Portfolio Theory",
    gradient: "from-purple-700 via-violet-950 to-zinc-950",
    videoEmbedUrl: "https://www.youtube.com/embed/p-UXVsbKPcs",
    videoCreator: "Derek Moore",
  },
  {
    id: "bond-ladders",
    concept: "Bond ladders — managing interest rate and reinvestment risk",
    level: "Advanced",
    topic: "Fixed Income",
    gradient: "from-fuchsia-700 via-violet-950 to-zinc-950",
    videoEmbedUrl: "https://www.youtube.com/embed/IjZ12Eh0SCo",
    videoCreator: "The Money Guy Show",
  },
  {
    id: "smart-beta",
    concept: "Smart beta and factor-tilted index investing",
    level: "Advanced",
    topic: "Factor Investing",
    gradient: "from-violet-800 via-purple-950 to-zinc-950",
    videoEmbedUrl: "https://www.youtube.com/embed/ROt2njtP4hE",
    videoCreator: "ETF Insider",
  },
  {
    id: "concentrated-positions",
    concept: "Managing concentrated stock positions and diversification risk",
    level: "Advanced",
    topic: "Risk Management",
    gradient: "from-pink-700 via-violet-950 to-zinc-950",
    // No curated standalone video found — falls back to "Find a related video" CTA
  },

  // ── Quant ────────────────────────────────────────────────────────────
  {
    id: "value-at-risk",
    concept: "Value at Risk (VaR) — measuring downside in dollar terms",
    level: "Quant",
    topic: "Risk Metrics",
    gradient: "from-amber-700 via-amber-950 to-zinc-950",
    videoEmbedUrl: "https://www.youtube.com/embed/2SMkbMDypXI",
    videoCreator: "Ryan O'Connell, CFA, FRM",
  },
  {
    id: "sortino-ratio",
    concept: "Sortino ratio — measuring downside-adjusted returns",
    level: "Quant",
    topic: "Risk-Adjusted Performance",
    gradient: "from-yellow-700 via-amber-950 to-zinc-950",
    videoEmbedUrl: "https://www.youtube.com/embed/S6clqyKlFNI",
    videoCreator: "PortfoliosLab",
  },
  {
    id: "beta-hedging",
    concept: "Beta hedging — neutralizing market exposure",
    level: "Quant",
    topic: "Hedging",
    gradient: "from-orange-700 via-amber-950 to-zinc-950",
    // No curated standalone video found — falls back to "Find a related video" CTA
  },
  {
    id: "bond-convexity",
    concept: "Bond convexity and duration — second-order interest rate risk",
    level: "Quant",
    topic: "Fixed Income Math",
    gradient: "from-amber-800 via-orange-950 to-zinc-950",
    videoEmbedUrl: "https://www.youtube.com/embed/9GOfBq5Go9U",
    videoCreator: "Ryan O'Connell, CFA, FRM",
  },
  {
    id: "monte-carlo-retirement",
    concept: "Monte Carlo simulation for retirement planning",
    level: "Quant",
    topic: "Simulation",
    gradient: "from-yellow-800 via-amber-950 to-zinc-950",
    videoEmbedUrl: "https://www.youtube.com/embed/ZsPkmGcdNzc",
    videoCreator: "Boldin",
  },
] as const;

export function seedsByLevel(level: Level): readonly ConceptSeed[] {
  return CONCEPT_SEEDS.filter((s) => s.level === level);
}
