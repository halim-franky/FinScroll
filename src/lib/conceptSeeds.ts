/**
 * Financial concept seeds for dynamic FinTok card generation.
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
}

export const CONCEPT_SEEDS: readonly ConceptSeed[] = [
  // ── Beginner ──────────────────────────────────────────────────────────
  {
    id: "pay-yourself-first",
    concept: "Pay yourself first — automated savings principle",
    level: "Beginner",
    topic: "Saving Habits",
    gradient: "from-emerald-700 via-emerald-950 to-zinc-950",
  },
  {
    id: "sinking-funds",
    concept: "Sinking funds — saving systematically for irregular expenses",
    level: "Beginner",
    topic: "Budgeting",
    gradient: "from-teal-700 via-teal-950 to-zinc-950",
  },
  {
    id: "credit-score-basics",
    concept: "Credit score components and how to improve them",
    level: "Beginner",
    topic: "Credit",
    gradient: "from-green-700 via-emerald-950 to-zinc-950",
  },
  {
    id: "401k-match",
    concept: "401(k) employer match — why it's free money",
    level: "Beginner",
    topic: "Retirement",
    gradient: "from-lime-700 via-emerald-950 to-zinc-950",
  },
  {
    id: "term-life-insurance",
    concept: "Term life insurance vs whole life — which makes financial sense",
    level: "Beginner",
    topic: "Insurance",
    gradient: "from-emerald-800 via-teal-950 to-zinc-950",
  },

  // ── Intermediate ─────────────────────────────────────────────────────
  {
    id: "hsa-triple-tax",
    concept: "Health Savings Account triple tax advantage",
    level: "Intermediate",
    topic: "Tax-Advantaged Accounts",
    gradient: "from-sky-700 via-sky-950 to-zinc-950",
  },
  {
    id: "asset-location",
    concept: "Asset location — placing investments in optimal account types",
    level: "Intermediate",
    topic: "Tax Optimization",
    gradient: "from-cyan-700 via-sky-950 to-zinc-950",
  },
  {
    id: "portfolio-rebalancing",
    concept: "Portfolio rebalancing — why and how to do it",
    level: "Intermediate",
    topic: "Portfolio Management",
    gradient: "from-blue-700 via-sky-950 to-zinc-950",
  },
  {
    id: "backdoor-roth",
    concept: "Backdoor Roth IRA conversion strategy for high earners",
    level: "Intermediate",
    topic: "Retirement Tax Strategy",
    gradient: "from-indigo-700 via-sky-950 to-zinc-950",
  },
  {
    id: "expense-ratios",
    concept: "Expense ratios — how small fees compound to massive losses",
    level: "Intermediate",
    topic: "Fund Selection",
    gradient: "from-sky-800 via-blue-950 to-zinc-950",
  },

  // ── Advanced ─────────────────────────────────────────────────────────
  {
    id: "tax-loss-harvesting",
    concept: "Tax-loss harvesting — turning losses into tax savings",
    level: "Advanced",
    topic: "Tax Strategy",
    gradient: "from-violet-700 via-violet-950 to-zinc-950",
  },
  {
    id: "risk-parity",
    concept: "Risk parity portfolio construction",
    level: "Advanced",
    topic: "Portfolio Theory",
    gradient: "from-purple-700 via-violet-950 to-zinc-950",
  },
  {
    id: "bond-ladders",
    concept: "Bond ladders — managing interest rate and reinvestment risk",
    level: "Advanced",
    topic: "Fixed Income",
    gradient: "from-fuchsia-700 via-violet-950 to-zinc-950",
  },
  {
    id: "smart-beta",
    concept: "Smart beta and factor-tilted index investing",
    level: "Advanced",
    topic: "Factor Investing",
    gradient: "from-violet-800 via-purple-950 to-zinc-950",
  },
  {
    id: "concentrated-positions",
    concept: "Managing concentrated stock positions and diversification risk",
    level: "Advanced",
    topic: "Risk Management",
    gradient: "from-pink-700 via-violet-950 to-zinc-950",
  },

  // ── Quant ────────────────────────────────────────────────────────────
  {
    id: "value-at-risk",
    concept: "Value at Risk (VaR) — measuring downside in dollar terms",
    level: "Quant",
    topic: "Risk Metrics",
    gradient: "from-amber-700 via-amber-950 to-zinc-950",
  },
  {
    id: "sortino-ratio",
    concept: "Sortino ratio — measuring downside-adjusted returns",
    level: "Quant",
    topic: "Risk-Adjusted Performance",
    gradient: "from-yellow-700 via-amber-950 to-zinc-950",
  },
  {
    id: "beta-hedging",
    concept: "Beta hedging — neutralizing market exposure",
    level: "Quant",
    topic: "Hedging",
    gradient: "from-orange-700 via-amber-950 to-zinc-950",
  },
  {
    id: "bond-convexity",
    concept: "Bond convexity and duration — second-order interest rate risk",
    level: "Quant",
    topic: "Fixed Income Math",
    gradient: "from-amber-800 via-orange-950 to-zinc-950",
  },
  {
    id: "monte-carlo-retirement",
    concept: "Monte Carlo simulation for retirement planning",
    level: "Quant",
    topic: "Simulation",
    gradient: "from-yellow-800 via-amber-950 to-zinc-950",
  },
] as const;

export function seedsByLevel(level: Level): readonly ConceptSeed[] {
  return CONCEPT_SEEDS.filter((s) => s.level === level);
}
