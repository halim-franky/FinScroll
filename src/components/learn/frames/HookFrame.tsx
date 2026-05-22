"use client";

import type { Card } from "@/lib/learn/types";
import { Sparkles } from "lucide-react";

interface Props {
  card: Card;
  isActive: boolean;
}

export function HookFrame({ card, isActive }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-6 animate-fadeIn">
      <div
        className={`text-7xl transition-transform duration-700 ${
          isActive ? "scale-100" : "scale-90 opacity-50"
        }`}
      >
        {card.emoji}
      </div>
      <div className="space-y-3">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
          <Sparkles className="w-3 h-3" />
          {card.topic}
        </span>
        <h2 className="text-3xl font-black text-white tracking-tight leading-tight">
          {card.title}
        </h2>
        <p className="text-base text-zinc-300 font-medium italic max-w-xs">
          &ldquo;{card.hook}&rdquo;
        </p>
      </div>
      <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest">
        Tap right to continue →
      </p>
    </div>
  );
}
