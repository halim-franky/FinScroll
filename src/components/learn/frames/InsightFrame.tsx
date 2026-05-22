"use client";

import { useMemo } from "react";
import type { Card } from "@/lib/learn/types";
import { personalizedLine } from "@/lib/learn/personalization";
import { readOnboarding } from "@/components/OnboardingModal";
import { TrendingUp, User } from "lucide-react";

interface Props {
  card: Card;
  userId: string;
  isActive: boolean;
}

export function InsightFrame({ card, userId, isActive }: Props) {
  const personalized = useMemo(() => {
    const onboarding = readOnboarding(userId);
    return personalizedLine(card.personalizedTemplates, onboarding);
  }, [card.personalizedTemplates, userId]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-5 animate-fadeIn">
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-400">
          <TrendingUp className="w-3 h-3" />
          {card.impactLabel}
        </span>
        <div className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 to-emerald-500">
          {card.impactValue}
        </div>
      </div>

      <p className="text-base text-zinc-100 font-bold leading-snug max-w-sm">
        {card.insight}
      </p>

      {personalized && (
        <div className="w-full max-w-sm p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl text-left flex items-start gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 shrink-0 mt-0.5">
            <User className="w-3 h-3 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">
              What this means for you
            </p>
            <p className="text-xs text-zinc-200 leading-relaxed">{personalized}</p>
          </div>
        </div>
      )}

      {!personalized && isActive && (
        <p className="text-[11px] text-zinc-500 max-w-xs">{card.keyFact.split(".")[0]}.</p>
      )}
    </div>
  );
}
