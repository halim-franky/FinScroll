"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Card } from "@/lib/learn/types";
import { personalizedLine } from "@/lib/learn/personalization";
import { readOnboarding } from "@/components/OnboardingModal";
import { computeImpact, formatCompactCurrency, HORIZON_YEARS, REDIRECT_FRACTION } from "@/lib/learn/impact";
import { TrendingUp, User, Sparkles, MessageCircle, ArrowUpRight } from "lucide-react";
import { useCountUp } from "@/lib/useCountUp";

interface Props {
  card: Card;
  userId: string;
  isActive: boolean;
}

export function InsightFrame({ card, userId, isActive }: Props) {
  const onboarding = useMemo(() => readOnboarding(userId), [userId]);
  const personalized = useMemo(
    () => personalizedLine(card.personalizedTemplates, onboarding),
    [card.personalizedTemplates, onboarding],
  );
  const impact = useMemo(() => computeImpact(onboarding), [onboarding]);

  // Hero counter — kicks up to the full personalized future value when active
  const animatedFV = useCountUp(impact.futureValue, 1200, isActive);
  const showAnimated = animatedFV < impact.futureValue;

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <div className="flex flex-col items-center gap-5 max-w-sm">

        {/* Hero: personalized 30-year future value — the FinScroll signature.
            Replaces the generic impactValue with a number computed from THIS
            user's onboarding. No other app in the category does this. */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-300">
            <Sparkles className="w-3 h-3" />
            Your {HORIZON_YEARS}-year future
          </div>
          <div className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-emerald-200 via-emerald-300 to-emerald-500 tabular-nums leading-none">
            {showAnimated
              ? formatCompactCurrency(animatedFV)
              : formatCompactCurrency(impact.futureValue)}
          </div>
          <p className="text-[11px] text-zinc-300 max-w-[16rem] mx-auto leading-snug">
            If you redirect {Math.round(REDIRECT_FRACTION * 100)}% of your{" "}
            <span className="font-bold text-zinc-100 tabular-nums">
              {impact.scrollHours}h/day
            </span>{" "}
            scroll habit into wealth-building like this.
          </p>
        </div>

        {/* Card-specific insight, kept compact so the hero stays the focus */}
        <div className="w-full border-t border-zinc-800 pt-4 space-y-3">
          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-400">
            <TrendingUp className="w-3 h-3" />
            {card.impactLabel}
          </span>
          <div className="text-3xl font-black tracking-tighter text-white tabular-nums leading-none">
            {card.impactValue}
          </div>
          <p className="text-sm text-zinc-100 font-semibold leading-snug">
            {card.insight}
          </p>
        </div>

        {personalized && (
          <div className="w-full p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-left flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 shrink-0 mt-0.5">
              <User className="w-3 h-3 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">
                What this means for you
              </p>
              <p className="text-xs text-zinc-100 leading-relaxed">{personalized}</p>
            </div>
          </div>
        )}

        {/* RAG-powered: take the user to the Coach with this concept already
            in context. The Coach pre-fills a contextual welcome message and
            grounds retrieval on this card's keyFact. */}
        <Link
          href={`/chat?cardId=${encodeURIComponent(String(card.id))}`}
          className="w-full inline-flex items-center justify-between gap-2 p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 hover:bg-sky-500/15 hover:border-sky-500/50 transition-colors group"
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <span className="p-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30 shrink-0">
              <MessageCircle className="w-3 h-3 text-sky-300" />
            </span>
            <span className="text-left">
              <span className="block text-[10px] font-black uppercase tracking-widest text-sky-300 leading-tight">
                Ask Coach
              </span>
              <span className="block text-xs text-zinc-100 leading-snug">
                Dig deeper into{" "}
                <span className="font-semibold">{card.topic}</span>
              </span>
            </span>
          </span>
          <ArrowUpRight className="w-4 h-4 text-sky-300 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>

        <p className="text-[9px] text-zinc-500 max-w-xs leading-relaxed">
          Future value modeled at 8% annual return, $3/hour opportunity cost.
          Not financial advice.
        </p>
      </div>
    </div>
  );
}
