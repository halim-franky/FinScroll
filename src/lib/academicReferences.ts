/**
 * Curated academic references library.
 *
 * Why this file exists:
 *   The chat RAG pipeline retrieves chunks from Pinecone, which is currently
 *   seeded with SEC Investor.gov content. When the SPRINGER_API_KEY isn't
 *   configured, Springer/Elsevier ingestion silently no-ops, so academic
 *   journal sources never make it into the vector index — leaving every
 *   chat response pointing only at investor.gov.
 *
 *   To deliver on the "SEC & academic research" promise, the chat service
 *   matches the user's question against this curated list and appends any
 *   relevant academic citations to the source pills. Every entry here is a
 *   real, well-cited paper with a stable URL — we don't fabricate.
 *
 * Maintenance:
 *   - Add new entries when adding new concept cards to cards.ts so the chat
 *     has academic backing for them too.
 *   - URLs should be the most authoritative free landing page available
 *     (NBER working-paper page, journal abstract, university repository).
 */

export interface AcademicReference {
  /** Lowercase keywords that should trigger this citation. Match is substring. */
  triggers: readonly string[];
  /** Short attribution, shown as the source pill label. */
  label: string;
  /** Canonical free-access URL for the paper. */
  url: string;
}

export const ACADEMIC_REFERENCES: readonly AcademicReference[] = [
  // ── Compound interest / starting early ──────────────────────────────
  {
    triggers: [
      "compound interest",
      "compounding",
      "start early",
      "invest early",
      "starting early",
      "time value",
      "long-term",
      "long term",
      "life cycle",
      "lifecycle",
    ],
    label: "Modigliani — Life Cycle Hypothesis (Nobel Lecture)",
    url: "https://www.nobelprize.org/prizes/economic-sciences/1985/modigliani/lecture/",
  },

  // ── Index funds / passive vs active ─────────────────────────────────
  {
    triggers: [
      "index fund",
      "index funds",
      "passive investing",
      "active vs passive",
      "spiva",
      "mutual fund",
      "etf",
    ],
    label: "S&P Global — SPIVA Scorecard",
    url: "https://www.spglobal.com/spdji/en/research-insights/spiva/",
  },
  {
    triggers: ["bogle", "vanguard", "common sense investing"],
    label: "Bogle — Common Sense on Mutual Funds (Wiley)",
    url: "https://onlinelibrary.wiley.com/doi/book/10.1002/9781119109549",
  },

  // ── Modern portfolio theory ─────────────────────────────────────────
  {
    triggers: [
      "diversification",
      "portfolio theory",
      "modern portfolio",
      "markowitz",
      "efficient frontier",
    ],
    label: "Markowitz — Portfolio Selection (Journal of Finance, 1952)",
    url: "https://onlinelibrary.wiley.com/doi/10.1111/j.1540-6261.1952.tb01525.x",
  },

  // ── Fama-French factor models ───────────────────────────────────────
  {
    triggers: [
      "fama",
      "french",
      "factor investing",
      "three factor",
      "five factor",
      "small cap value",
      "value premium",
      "size premium",
    ],
    label: "Fama & French — Common Risk Factors (J. Financial Economics, 1993)",
    url: "https://www.sciencedirect.com/science/article/abs/pii/0304405X93900235",
  },

  // ── CAPM ────────────────────────────────────────────────────────────
  {
    triggers: ["capm", "capital asset pricing", "beta", "sharpe", "lintner"],
    label: "Sharpe — Capital Asset Prices (Journal of Finance, 1964)",
    url: "https://onlinelibrary.wiley.com/doi/10.1111/j.1540-6261.1964.tb02865.x",
  },

  // ── Behavioral finance / day trading losses ─────────────────────────
  {
    triggers: [
      "day trader",
      "day trading",
      "retail trader",
      "behavioral finance",
      "barber",
      "odean",
      "overconfidence",
    ],
    label:
      "Barber, Lee, Liu & Odean — Do Day Traders Rationally Learn About Their Ability? (Berkeley Haas)",
    url: "https://faculty.haas.berkeley.edu/odean/papers/day%20traders/day%20trading%20and%20learning%20110217.pdf",
  },

  // ── Dollar-cost averaging ───────────────────────────────────────────
  {
    triggers: ["dollar cost averaging", "dca", "lump sum vs"],
    label:
      "Vanguard — Dollar-Cost Averaging Just Means Taking Risk Later (research)",
    url: "https://corporate.vanguard.com/content/dam/corp/research/pdf/dollar-cost-averaging-just-means-taking-risk-later-us-isgdca.pdf",
  },

  // ── Inflation ───────────────────────────────────────────────────────
  {
    triggers: ["inflation", "purchasing power", "real return", "cpi"],
    label: "Federal Reserve — Inflation: Causes, Consequences, and Policy",
    url: "https://www.federalreserve.gov/faqs/economy_14400.htm",
  },

  // ── Behavioral biases / loss aversion ───────────────────────────────
  {
    triggers: [
      "loss aversion",
      "prospect theory",
      "kahneman",
      "tversky",
      "anchoring",
      "behavioral bias",
    ],
    label:
      "Kahneman & Tversky — Prospect Theory: An Analysis of Decision under Risk (Econometrica)",
    url: "https://www.jstor.org/stable/1914185",
  },

  // ── Retirement / 401k / Roth IRA ────────────────────────────────────
  {
    triggers: [
      "retirement",
      "401k",
      "401(k)",
      "roth ira",
      "traditional ira",
      "tax-advantaged",
    ],
    label:
      "Poterba, Venti & Wise — How Retirement Saving Programs Increase Saving (NBER)",
    url: "https://www.nber.org/papers/w5599",
  },

  // ── Financial literacy outcomes ─────────────────────────────────────
  {
    triggers: [
      "financial literacy",
      "financial education",
      "lusardi",
      "mitchell",
    ],
    label:
      "Lusardi & Mitchell — The Economic Importance of Financial Literacy (J. Economic Literature)",
    url: "https://www.aeaweb.org/articles?id=10.1257/jel.52.1.5",
  },

  // ── Emergency fund / precautionary savings ──────────────────────────
  {
    triggers: ["emergency fund", "precautionary saving", "buffer stock"],
    label:
      "Carroll — Buffer-Stock Saving and the Life Cycle/Permanent Income Hypothesis (Quarterly J. Economics)",
    url: "https://www.jstor.org/stable/2946930",
  },
];

/**
 * Picks academic references whose triggers appear in the user's message
 * OR the retrieved-context text. Deduped by URL and capped to keep the
 * source pill row tidy.
 */
export function pickAcademicReferences(
  userMessage: string,
  retrievedContext = "",
  max = 2,
): AcademicReference[] {
  const haystack = `${userMessage}\n${retrievedContext}`.toLowerCase();
  const seen = new Set<string>();
  const picks: AcademicReference[] = [];
  for (const ref of ACADEMIC_REFERENCES) {
    if (picks.length >= max) break;
    if (seen.has(ref.url)) continue;
    if (ref.triggers.some((t) => haystack.includes(t.toLowerCase()))) {
      picks.push(ref);
      seen.add(ref.url);
    }
  }
  return picks;
}

/**
 * Did the user explicitly ask for academic / research / study / journal /
 * evidence-style sources? If so we should try harder to surface them.
 */
export function userRequestedAcademic(userMessage: string): boolean {
  const q = userMessage.toLowerCase();
  return /\b(academic|journal|paper|study|studies|research|evidence|peer[- ]?reviewed|citation|reference|nber|fama|markowitz|sharpe|kahneman)\b/.test(
    q,
  );
}
