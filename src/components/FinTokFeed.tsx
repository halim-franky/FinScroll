"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Heart, Bookmark, BookOpen, CheckCircle, XCircle,
  ChevronDown, ChevronUp, ExternalLink, MessageSquare,
  ChevronRight, Sparkles,
} from "lucide-react";
import { readOnboarding, type Struggle } from "./OnboardingModal";

// Pick the most relevant starting card index based on the user's
// onboarding answer. Card IDs come from the CARDS array below.
const STRUGGLE_TO_START_CARD: Record<Struggle, number> = {
  saving: 0,     // Card 1: The 50/30/20 Rule
  debt: 1,       // Card 2: Emergency fund — break the debt cycle
  investing: 4,  // Card 5: Index funds — first real investment
  all: 0,        // Default: start from the beginning
};

type Level = "Beginner" | "Intermediate" | "Advanced" | "Quant";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface Card {
  id: string | number;
  level: Level;
  topic: string;
  title: string;
  hook: string;
  keyFact: string;
  impactLabel: string;
  impactValue: string;
  gradient: string;
  emoji: string;
  creator: string;
  visualData?: { label: string; value: string; percent: number }[];
  quiz: QuizQuestion;
  source: string;
  sourceUrl: string;
  generated?: boolean;
}

const LEVEL_META: Record<Level, { color: string; bg: string; emoji: string; order: number }> = {
  Beginner:     { color: "text-emerald-400", bg: "bg-emerald-500/20 border-emerald-500/40", emoji: "🌱", order: 1 },
  Intermediate: { color: "text-sky-400",     bg: "bg-sky-500/20 border-sky-500/40",         emoji: "📈", order: 2 },
  Advanced:     { color: "text-violet-400",  bg: "bg-violet-500/20 border-violet-500/40",   emoji: "🔬", order: 3 },
  Quant:        { color: "text-amber-400",   bg: "bg-amber-500/20 border-amber-500/40",     emoji: "⚡", order: 4 },
};

const CARDS: Card[] = [
  // ── BEGINNER ──────────────────────────────────────────────────────────────
  {
    id: 1,
    level: "Beginner",
    topic: "Budgeting",
    title: "The 50/30/20 Rule",
    hook: "One rule. Total clarity over your money forever.",
    keyFact: "Split every paycheck: 50% needs, 30% wants, 20% savings & debt. The SEC recommends this as the simplest starting framework for financial health.",
    impactLabel: "$3,000 salary → Savings",
    impactValue: "$600/month",
    gradient: "from-emerald-800 via-emerald-950 to-zinc-950",
    emoji: "💰",
    creator: "@finscroll_basics",
    visualData: [
      { label: "Needs (rent, food, bills)", value: "50% — $1,500", percent: 50 },
      { label: "Wants (fun, subscriptions)", value: "30% — $900", percent: 30 },
      { label: "Savings & debt payoff", value: "20% — $600", percent: 20 },
    ],
    quiz: {
      question: "On a $4,000/month salary using 50/30/20, how much goes to savings?",
      options: ["$400", "$800", "$1,200", "$2,000"],
      correctIndex: 1,
      explanation: "20% of $4,000 = $800 goes directly to savings and debt payoff each month.",
    },
    source: "SEC Investor.gov",
    sourceUrl: "investor.gov",
  },
  {
    id: 2,
    level: "Beginner",
    topic: "Emergency Fund",
    title: "Your Financial Airbag",
    hook: "One unexpected bill shouldn't destroy your financial life.",
    keyFact: "3–6 months of expenses in a high-yield savings account. This single habit separates financially stable people from those living paycheck to paycheck.",
    impactLabel: "Avg unexpected expense",
    impactValue: "$3,500",
    gradient: "from-teal-800 via-teal-950 to-zinc-950",
    emoji: "🛡️",
    creator: "@finscroll_basics",
    visualData: [
      { label: "No emergency fund (you)", value: "Goes into debt", percent: 100 },
      { label: "3-month fund ($6,000)", value: "Zero debt taken", percent: 0 },
    ],
    quiz: {
      question: "Where should you keep your emergency fund?",
      options: [
        "Stock market for growth",
        "Under your mattress",
        "High-yield savings account",
        "Crypto for fast access",
      ],
      correctIndex: 2,
      explanation: "HYSA gives you 4-5% APY while keeping funds instantly accessible. Stocks are too volatile for emergency money.",
    },
    source: "SEC Investor.gov — Saving Basics",
    sourceUrl: "investor.gov",
  },
  {
    id: 3,
    level: "Beginner",
    topic: "Compound Interest",
    title: "The 8th Wonder of the World",
    hook: "Einstein (allegedly) called it the most powerful force in the universe. Here's why.",
    keyFact: "Interest earned on your interest. $1,000 at 8% annual return becomes $10,063 in 30 years — without adding a single dollar. Time is the only variable you can't buy back.",
    impactLabel: "$1,000 invested at age 20",
    impactValue: "$10,063 by 50",
    gradient: "from-emerald-700 via-zinc-900 to-zinc-950",
    emoji: "🧋",
    creator: "@finscroll_basics",
    visualData: [
      { label: "Cash under mattress (30yr)", value: "$1,000", percent: 10 },
      { label: "At 8% compound return", value: "$10,063", percent: 100 },
    ],
    quiz: {
      question: "What makes compound interest more powerful than simple interest?",
      options: [
        "Higher interest rates",
        "You earn interest on your interest",
        "Government tax benefits",
        "Lower risk",
      ],
      correctIndex: 1,
      explanation: "Compound interest earns returns on both your principal AND previously earned interest — creating exponential growth over time.",
    },
    source: "SEC Investor.gov — Compound Interest",
    sourceUrl: "investor.gov/compound-interest",
  },
  {
    id: 4,
    level: "Beginner",
    topic: "Inflation",
    title: "The Silent Wealth Destroyer",
    hook: "Doing nothing with your money is actually losing money every single year.",
    keyFact: "At 3% annual inflation, $10,000 today has only $7,374 of purchasing power in 10 years. Holding cash in a zero-interest account guarantees you lose real wealth.",
    impactLabel: "$10,000 cash after 10 years",
    impactValue: "$7,374 real value",
    gradient: "from-rose-800 via-rose-950 to-zinc-950",
    emoji: "📉",
    creator: "@finscroll_basics",
    visualData: [
      { label: "Nominal value (on paper)", value: "$10,000", percent: 100 },
      { label: "Real purchasing power", value: "$7,374", percent: 74 },
    ],
    quiz: {
      question: "If inflation is 3%/year, what happens to $100 in a 0% interest account after 10 years?",
      options: [
        "It stays worth $100",
        "It grows slightly",
        "It loses ~26% of its real value",
        "It doubles",
      ],
      correctIndex: 2,
      explanation: "3% annual inflation compounds to a ~26% loss in purchasing power over 10 years. This is why holding uninvested cash is always a losing strategy.",
    },
    source: "Springer Nature — Journal of Economics",
    sourceUrl: "10.1007/s12197-023-09612-3",
  },

  // ── INTERMEDIATE ──────────────────────────────────────────────────────────
  {
    id: 5,
    level: "Intermediate",
    topic: "Passive Investing",
    title: "Why Index Funds Beat 92% of Experts",
    hook: "Most Wall Street professionals cannot beat a robot that just... doesn't try.",
    keyFact: "Over any 15-year period, 92% of actively managed funds underperform a simple S&P 500 index fund. The reason: fees + human emotion = guaranteed underperformance.",
    impactLabel: "$10k over 30 years (8% avg)",
    impactValue: "$100,626",
    gradient: "from-sky-800 via-sky-950 to-zinc-950",
    emoji: "📊",
    creator: "@finscroll_investing",
    visualData: [
      { label: "S&P 500 Index Fund (avg 8%)", value: "$100,626", percent: 100 },
      { label: "Average active fund (after fees)", value: "$57,435", percent: 57 },
    ],
    quiz: {
      question: "What % of actively managed funds fail to beat the S&P 500 over 15 years?",
      options: ["About 30%", "About 55%", "Over 92%", "Under 10%"],
      correctIndex: 2,
      explanation: "Per Elsevier research, 92%+ of actively managed funds underperform a passive index fund over 15 years, primarily due to higher fees and behavioral mistakes.",
    },
    source: "Elsevier — Journal of Financial Economics",
    sourceUrl: "10.1016/j.jfineco.2023.04.008",
  },
  {
    id: 6,
    level: "Intermediate",
    topic: "Tax-Advantaged Accounts",
    title: "Roth IRA: The Best Legal Tax Hack",
    hook: "The government created an account that lets your money grow 100% tax-free. Most Gen-Z ignores it.",
    keyFact: "Roth IRA: contribute after-tax dollars now, pay ZERO tax on growth or withdrawals forever. $6,500/yr from age 22 to 65 at 8% = $2.1M tax-free. This is legal.",
    impactLabel: "Roth IRA at retirement",
    impactValue: "$2.1M tax-free",
    gradient: "from-cyan-800 via-sky-950 to-zinc-950",
    emoji: "🏦",
    creator: "@finscroll_investing",
    visualData: [
      { label: "Tax-free Roth IRA growth", value: "$2.1M kept", percent: 100 },
      { label: "Same in taxable account (35% tax)", value: "$1.37M kept", percent: 65 },
    ],
    quiz: {
      question: "When do you pay taxes on a Roth IRA?",
      options: [
        "When you withdraw at retirement",
        "On all capital gains annually",
        "Only on contributions — growth is tax-free",
        "Every year on earnings",
      ],
      correctIndex: 2,
      explanation: "You pay taxes on Roth IRA contributions upfront (with after-tax dollars), but all growth and qualified withdrawals are completely tax-free — forever.",
    },
    source: "SEC Investor.gov — Retirement Plans",
    sourceUrl: "investor.gov/roth-ira",
  },
  {
    id: 7,
    level: "Intermediate",
    topic: "Behavioral Finance",
    title: "Dollar Cost Averaging Kills Emotion",
    hook: "The most profitable thing you can do is make investing completely boring.",
    keyFact: "DCA = invest a fixed amount on a fixed schedule regardless of market conditions. When prices drop you buy more shares. When prices rise you buy less. You win either way.",
    impactLabel: "DCA vs Lump Sum (bear market)",
    impactValue: "+23% better",
    gradient: "from-indigo-800 via-sky-950 to-zinc-950",
    emoji: "🤖",
    creator: "@finscroll_investing",
    visualData: [
      { label: "DCA (ignore market noise)", value: "Avg cost: lower", percent: 85 },
      { label: "Timing the market", value: "95% fail at this", percent: 5 },
    ],
    quiz: {
      question: "What is the key advantage of Dollar Cost Averaging?",
      options: [
        "You always buy at the lowest price",
        "It removes emotional decision-making from investing",
        "It guarantees higher returns than lump sum",
        "It only works in bull markets",
      ],
      correctIndex: 1,
      explanation: "DCA removes the psychological burden of 'timing the market' — you invest consistently regardless of conditions, averaging out your cost basis over time.",
    },
    source: "Springer Nature — Behavioral Finance Review",
    sourceUrl: "springer.com",
  },

  // ── ADVANCED ──────────────────────────────────────────────────────────────
  {
    id: 8,
    level: "Advanced",
    topic: "Portfolio Theory",
    title: "Asset Allocation: The Only Free Lunch",
    hook: "Nobel laureate Harry Markowitz called diversification 'the only free lunch in investing.' Here's exactly why.",
    keyFact: "By combining assets with low correlation (stocks + bonds + real estate), you reduce portfolio volatility WITHOUT sacrificing expected return. Risk-adjusted performance improves mechanically.",
    impactLabel: "Portfolio volatility reduction",
    impactValue: "−40% risk",
    gradient: "from-violet-800 via-violet-950 to-zinc-950",
    emoji: "⚖️",
    creator: "@finscroll_advanced",
    visualData: [
      { label: "100% stocks (high volatility)", value: "σ = 18%/yr", percent: 100 },
      { label: "60/40 diversified portfolio", value: "σ = 11%/yr", percent: 61 },
    ],
    quiz: {
      question: "Why does diversification reduce portfolio risk without hurting expected returns?",
      options: [
        "You own safer assets with lower returns",
        "Uncorrelated assets cancel out each other's volatility",
        "Government guarantees protect diversified portfolios",
        "You pay less in taxes",
      ],
      correctIndex: 1,
      explanation: "When assets don't move together (low correlation), losses in one are offset by gains in another. The math shows this reduces variance without reducing the expected return.",
    },
    source: "Springer — Journal of Portfolio Management",
    sourceUrl: "springer.com",
  },
  {
    id: 9,
    level: "Advanced",
    topic: "Factor Investing",
    title: "The 5 Factors That Predict Returns",
    hook: "Fama & French proved the market has patterns. You can exploit them systematically.",
    keyFact: "The Fama-French 5-Factor Model: Market, Size (small beats large), Value (cheap beats expensive), Profitability (profitable beats unprofitable), Investment (conservative beats aggressive). Academically validated alpha.",
    impactLabel: "Small-cap value premium",
    impactValue: "+3.5%/yr historically",
    gradient: "from-purple-800 via-violet-950 to-zinc-950",
    emoji: "🔬",
    creator: "@finscroll_advanced",
    visualData: [
      { label: "Market return (beta only)", value: "8% avg", percent: 70 },
      { label: "Small-cap value tilt (+factors)", value: "11.5% avg", percent: 100 },
    ],
    quiz: {
      question: "In the Fama-French model, which type of stocks have historically outperformed?",
      options: [
        "Large-cap growth stocks",
        "High-momentum tech stocks",
        "Small-cap value stocks",
        "Government bonds",
      ],
      correctIndex: 2,
      explanation: "Decades of academic research confirm small-cap value stocks earn a persistent premium over large-cap growth — the 'size' and 'value' factors in Fama-French.",
    },
    source: "Elsevier — Journal of Financial Economics",
    sourceUrl: "10.1016/j.jfineco.2014.10.010",
  },
  {
    id: 10,
    level: "Advanced",
    topic: "Risk Management",
    title: "Sequence of Returns: The Retirement Killer",
    hook: "Two investors with identical average returns can have wildly different outcomes. Timing destroys wealth.",
    keyFact: "If you retire and markets crash in your first 3 years of withdrawals, your portfolio may never recover — even if average returns are identical to someone who retires in a bull market. Order matters.",
    impactLabel: "Early bear market vs bull start",
    impactValue: "−47% lifetime wealth",
    gradient: "from-rose-800 via-violet-950 to-zinc-950",
    emoji: "⏳",
    creator: "@finscroll_advanced",
    visualData: [
      { label: "Retire into bull market", value: "$890,000 at 85", percent: 100 },
      { label: "Same returns, retire into bear", value: "$470,000 at 85", percent: 53 },
    ],
    quiz: {
      question: "Why does sequence of returns risk matter most at the start of retirement?",
      options: [
        "Taxes are higher in early retirement",
        "Early losses reduce the principal that would compound for decades",
        "Social Security isn't available yet",
        "Inflation is higher in early retirement",
      ],
      correctIndex: 1,
      explanation: "When you withdraw from a portfolio that's already declined, you sell more shares at low prices. Those shares can't recover for you — permanently impairing your wealth.",
    },
    source: "Springer Nature — Journal of Retirement",
    sourceUrl: "springer.com",
  },

  // ── QUANT ─────────────────────────────────────────────────────────────────
  {
    id: 11,
    level: "Quant",
    topic: "Risk Metrics",
    title: "The Sharpe Ratio: Are You Paid for Your Risk?",
    hook: "Not all returns are equal. A 15% return with huge volatility is worse than a 10% return with low volatility.",
    keyFact: "Sharpe Ratio = (Portfolio Return − Risk-Free Rate) / Standard Deviation. Measures return per unit of risk. Sharpe > 1.0 is good. > 2.0 is exceptional. Hedge funds aim for 1.5+.",
    impactLabel: "Sharpe Ratio target",
    impactValue: "≥ 1.5 (institutional)",
    gradient: "from-amber-800 via-amber-950 to-zinc-950",
    emoji: "⚡",
    creator: "@finscroll_quant",
    visualData: [
      { label: "High return, high volatility (S=0.6)", value: "Mediocre risk-adj", percent: 40 },
      { label: "Moderate return, low vol (S=1.8)", value: "Excellent risk-adj", percent: 100 },
    ],
    quiz: {
      question: "Fund A: 20% return, 25% vol. Fund B: 12% return, 8% vol. Risk-free rate: 4%. Which has better Sharpe?",
      options: [
        "Fund A — higher absolute return",
        "Fund B — Sharpe ≈ 1.0 vs Fund A ≈ 0.64",
        "They are equal",
        "Cannot be determined",
      ],
      correctIndex: 1,
      explanation: "Fund A Sharpe = (20-4)/25 = 0.64. Fund B Sharpe = (12-4)/8 = 1.0. Fund B provides more return per unit of risk taken — the correct way to compare managers.",
    },
    source: "Elsevier — Journal of Portfolio Management",
    sourceUrl: "springer.com",
  },
  {
    id: 12,
    level: "Quant",
    topic: "Derivatives",
    title: "Options 101: Buying the Right to Buy",
    hook: "TikTok influencers blow up accounts trading options. Here's what they don't tell you — the actual math.",
    keyFact: "A call option gives you the RIGHT (not obligation) to buy 100 shares at a strike price before expiry. You pay a premium. Max loss = premium paid. Max gain = unlimited. 90% of retail options traders lose money.",
    impactLabel: "Retail options traders: loss rate",
    impactValue: "90% lose money",
    gradient: "from-yellow-800 via-amber-950 to-zinc-950",
    emoji: "📐",
    creator: "@finscroll_quant",
    visualData: [
      { label: "Options expire worthless (OTM)", value: "~70% of contracts", percent: 70 },
      { label: "Retail traders profitable long-term", value: "< 10%", percent: 10 },
    ],
    quiz: {
      question: "You buy 1 call option (100 shares) at $2 premium, strike $50, stock at $48. What is your maximum loss?",
      options: [
        "$4,800 (full stock value)",
        "$200 (premium paid)",
        "$50 per share × 100",
        "Unlimited",
      ],
      correctIndex: 1,
      explanation: "When buying options (not selling), your maximum loss is capped at the premium paid. Here: $2 × 100 shares = $200. This is the asymmetric structure that makes buying options appealing — limited downside, unlimited upside.",
    },
    source: "Springer — Review of Financial Studies",
    sourceUrl: "springer.com",
  },
];

const STORAGE_KEY = (uid: string) => `finscroll_v2_${uid}`;

interface FinTokFeedProps {
  userId?: string;
}

export function FinTokFeed({ userId = "guest" }: FinTokFeedProps) {
  const [active, setActive] = useState(0);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number | null>>({});
  const [generatedCards, setGeneratedCards] = useState<Card[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showQuiz, setShowQuiz] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [showSource, setShowSource] = useState<Record<string, boolean>>({});
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(userId));
      if (raw) {
        const s = JSON.parse(raw);
        setLiked(s.liked ?? {});
        setSaved(s.saved ?? {});
        setCompleted(s.completed ?? {});
      }
    } catch {}

    // First-time visitors: jump to the card most relevant to their
    // onboarding answer (Saving → 50/30/20, Debt → Emergency fund, etc.)
    try {
      const onboarding = readOnboarding(userId);
      const previousSession = localStorage.getItem(STORAGE_KEY(userId));
      const isFirstVisit = !previousSession;
      if (onboarding && isFirstVisit && feedRef.current) {
        const targetIdx = STRUGGLE_TO_START_CARD[onboarding.struggle] ?? 0;
        if (targetIdx > 0 && targetIdx < ALL_CARDS.length) {
          // Defer to after layout so heights are correct
          requestAnimationFrame(() => {
            if (feedRef.current) {
              feedRef.current.scrollTop = feedRef.current.clientHeight * targetIdx;
              setActive(targetIdx);
            }
          });
        }
      }
    } catch {}

    // Fetch dynamically-generated cards from /api/cards. These are
    // grounded in Pinecone via Gemini and appended after the curated
    // 12 cards to extend the feed beyond hardcoded content.
    let cancelled = false;
    setLoadingMore(true);
    fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit: 8 }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.cards) return;
        setGeneratedCards(data.cards as Card[]);
      })
      .catch(() => {
        // Silent fail — user still has the 12 curated cards
      })
      .finally(() => {
        if (!cancelled) setLoadingMore(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Merged feed: curated foundation + dynamically generated extras
  const ALL_CARDS: Card[] = [...CARDS, ...generatedCards];

  const persist = useCallback((updates: object) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(userId)) ?? "{}";
      localStorage.setItem(STORAGE_KEY(userId), JSON.stringify({ ...JSON.parse(raw), ...updates }));
    } catch {}
  }, [userId]);

  const handleScroll = useCallback(() => {
    if (!feedRef.current) return;
    const idx = Math.round(feedRef.current.scrollTop / feedRef.current.clientHeight);
    if (idx !== active && idx >= 0 && idx < ALL_CARDS.length) setActive(idx);
  }, [active]);

  const handleLike = (id: string | number) => {
    const next = { ...liked, [id]: !liked[id] };
    setLiked(next);
    persist({ liked: next });
  };

  const handleSave = (id: string | number) => {
    const next = { ...saved, [id]: !saved[id] };
    setSaved(next);
    persist({ saved: next });
  };

  const handleAnswer = (cardId: string | number, answer: number, correct: number) => {
    setQuizAnswers(p => ({ ...p, [cardId]: answer }));
    if (answer === correct && !completed[cardId]) {
      const next = { ...completed, [cardId]: true };
      setCompleted(next);

      // Append to weeklyLog for the weekly challenge widget
      try {
        const raw = localStorage.getItem(STORAGE_KEY(userId)) ?? "{}";
        const existing = JSON.parse(raw);
        const weeklyLog: number[] = Array.isArray(existing.weeklyLog) ? existing.weeklyLog : [];
        weeklyLog.push(Date.now());
        persist({ completed: next, weeklyLog });
      } catch {
        persist({ completed: next });
      }

      // Update streak (unchanged)
      try {
        const today = new Date().toDateString();
        const last = localStorage.getItem("fs_streak_date");
        const streak = parseInt(localStorage.getItem("fs_streak") ?? "0", 10);
        if (last !== today) {
          const yesterday = new Date(Date.now() - 86400000).toDateString();
          localStorage.setItem("fs_streak", (last === yesterday ? streak + 1 : 1).toString());
          localStorage.setItem("fs_streak_date", today);
        }
      } catch {}
    }
  };

  const completedCount = Object.values(completed).filter(Boolean).length;

  return (
    <div className="h-full w-full relative bg-zinc-950">
      {/* Minimal top HUD */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-safe pt-3 pb-2 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="text-white font-black text-sm tracking-tight">FinScroll</span>
          <span className="text-zinc-400 text-xs">·</span>
          <span className="text-zinc-400 text-xs font-medium">For You</span>
        </div>
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {loadingMore && (
            <div className="flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-full border border-fuchsia-500/30">
              <div className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" />
              <span className="text-[10px] font-bold text-fuchsia-300">Generating</span>
            </div>
          )}
          <div className="flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-full border border-zinc-700/50">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400">{completedCount}/{ALL_CARDS.length} mastered</span>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div
        ref={feedRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      >
        {ALL_CARDS.map((card, idx) => {
          const isActive = active === idx;
          const meta = LEVEL_META[card.level];
          const quizOpen = showQuiz[card.id];
          const userAnswer = quizAnswers[card.id];
          const answered = userAnswer !== undefined && userAnswer !== null;
          const isCorrect = userAnswer === card.quiz.correctIndex;
          const sourceOpen = showSource[card.id];

          return (
            <div
              key={card.id}
              className="relative w-full snap-start shrink-0 flex flex-col"
              style={{ height: "100dvh" }}
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-b ${card.gradient}`} />
              <div className="absolute inset-0 bg-black/20" />

              {/* Content */}
              <div className="relative z-10 flex flex-col h-full pt-16 pb-20">

                {/* Level + topic badge */}
                <div className="flex items-center gap-2 px-4 mb-3">
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${meta.bg} ${meta.color}`}>
                    {meta.emoji} {card.level}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{card.topic}</span>
                  {card.generated && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 text-[9px] font-black uppercase tracking-wider">
                      <Sparkles className="w-2.5 h-2.5" /> AI
                    </span>
                  )}
                </div>

                {/* Main content area */}
                <div className="flex-1 flex flex-col justify-center px-4 gap-4">

                  {quizOpen ? (
                    /* ── Quiz view ── */
                    <div className="space-y-3 animate-fadeIn">
                      <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest text-center">
                        🧠 Knowledge Check
                      </p>
                      <p className="text-white text-sm font-bold leading-snug text-center">
                        {card.quiz.question}
                      </p>
                      <div className="space-y-2">
                        {card.quiz.options.map((opt, oi) => {
                          let cls = "bg-black/50 border-zinc-700 text-zinc-200 hover:border-zinc-500";
                          if (answered) {
                            if (oi === card.quiz.correctIndex) cls = "bg-emerald-500/20 border-emerald-500 text-emerald-300";
                            else if (oi === userAnswer) cls = "bg-rose-500/20 border-rose-500 text-rose-300";
                            else cls = "bg-black/30 border-zinc-800 text-zinc-600";
                          }
                          return (
                            <button
                              key={oi}
                              disabled={answered}
                              onClick={() => handleAnswer(card.id, oi, card.quiz.correctIndex)}
                              className={`w-full text-left text-xs font-semibold px-3 py-2.5 rounded-xl border transition-all ${cls}`}
                            >
                              <span className="mr-2 text-zinc-500 font-mono">{String.fromCharCode(65 + oi)}.</span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {answered && (
                        <div className={`p-3 rounded-xl border text-[11px] leading-relaxed ${isCorrect ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-rose-500/10 border-rose-500/30 text-rose-300"}`}>
                          <div className="flex items-center gap-1.5 font-black mb-1">
                            {isCorrect ? <><CheckCircle className="w-3.5 h-3.5" /> Correct! +1 concept mastered</> : <><XCircle className="w-3.5 h-3.5" /> Not quite</>}
                          </div>
                          {card.quiz.explanation}
                        </div>
                      )}
                      <button onClick={() => setShowQuiz(p => ({ ...p, [card.id]: false }))} className="w-full text-center text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors">
                        ← Back to card
                      </button>
                    </div>
                  ) : (
                    /* ── Card content view ── */
                    <>
                      <div className="text-center space-y-2">
                        <div className="text-5xl">{card.emoji}</div>
                        <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
                          {card.title}
                        </h2>
                        <p className="text-zinc-300 text-sm font-medium italic">&ldquo;{card.hook}&rdquo;</p>
                      </div>

                      {/* Key fact */}
                      <div className="p-4 bg-black/50 border border-zinc-700/60 rounded-2xl backdrop-blur-md">
                        <p className="text-zinc-200 text-sm leading-relaxed">{card.keyFact}</p>
                      </div>

                      {/* Visual data bars */}
                      {card.visualData && (
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-baseline">
                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">{card.impactLabel}</span>
                            <span className="text-sm font-black text-emerald-400">{card.impactValue}</span>
                          </div>
                          {card.visualData.map(d => (
                            <div key={d.label} className="space-y-1">
                              <div className="flex justify-between text-[9px] text-zinc-400">
                                <span>{d.label}</span>
                                <span className="font-bold text-zinc-200">{d.value}</span>
                              </div>
                              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                                  style={{ width: isActive ? `${d.percent}%` : "0%" }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Quiz CTA */}
                      {!completed[card.id] ? (
                        <button
                          onClick={() => setShowQuiz(p => ({ ...p, [card.id]: true }))}
                          className="w-full py-3 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-yellow-500/25 transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Test Your Knowledge
                        </button>
                      ) : (
                        <div className="w-full py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider text-center flex items-center justify-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5" /> Concept Mastered
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Bottom strip: source + creator + actions */}
                <div className="px-4 space-y-2">
                  {/* Source */}
                  <button
                    onClick={() => setShowSource(p => ({ ...p, [card.id]: !p[card.id] }))}
                    className="w-full p-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl backdrop-blur-sm text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[8px] font-black text-emerald-400 tracking-widest uppercase">
                        <BookOpen className="w-3 h-3" /> Grounded: {card.source}
                      </div>
                      {sourceOpen ? <ChevronUp className="w-3 h-3 text-zinc-500" /> : <ChevronDown className="w-3 h-3 text-zinc-500" />}
                    </div>
                    {sourceOpen && (
                      <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center gap-1 text-[8px] text-sky-400 font-bold">
                        <ExternalLink className="w-2.5 h-2.5" /> {card.sourceUrl}
                      </div>
                    )}
                  </button>

                  {/* Creator row + actions */}
                  <div className="flex items-end justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-black text-white">{card.creator}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button onClick={() => handleLike(card.id)} className="flex flex-col items-center gap-0.5">
                        <div className={`p-2 rounded-full bg-black/40 border transition-all ${liked[card.id] ? "border-rose-500 text-rose-500" : "border-zinc-700 text-zinc-400"}`}>
                          <Heart className={`w-4 h-4 ${liked[card.id] ? "fill-rose-500" : ""}`} />
                        </div>
                      </button>
                      <button onClick={() => handleSave(card.id)} className="flex flex-col items-center gap-0.5">
                        <div className={`p-2 rounded-full bg-black/40 border transition-all ${saved[card.id] ? "border-yellow-500 text-yellow-500" : "border-zinc-700 text-zinc-400"}`}>
                          <Bookmark className={`w-4 h-4 ${saved[card.id] ? "fill-yellow-500" : ""}`} />
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Progress indicator */}
                  <div className="flex items-center gap-2 pb-1">
                    <div className="flex gap-1 flex-1">
                      {ALL_CARDS.map((c, i) => {
                        const isCurrentLevel = c.level === card.level;
                        return (
                          <div
                            key={i}
                            className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${
                              i === idx ? "bg-white" : i < idx ? "bg-white/40" : isCurrentLevel ? "bg-white/15" : "bg-zinc-800"
                            }`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-1 text-[8px] text-zinc-500">
                      <ChevronRight className="w-3 h-3" />
                      <span>{idx + 1}/{ALL_CARDS.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
