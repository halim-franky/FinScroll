"use client";

import type { Card } from "@/lib/learn/types";
import { BarChart3 } from "lucide-react";

interface Props {
  card: Card;
  isActive: boolean;
}

/**
 * Visual frame.
 *
 * Shows the card's hero number (impactValue) as the centered focal point,
 * surrounded by labelled progress bars from card.visualData. The card emoji
 * sits above as a small thematic accent.
 *
 * Previously we attempted to render hand-crafted Lottie animations here, but
 * they were barely visible on dark backgrounds. A clean SVG/data visualization
 * is more honest about what the frame is for: a quick visual of the impact.
 */
export function VisualFrame({ card, isActive }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center animate-fadeIn">
      <div className="flex flex-col items-center gap-5 max-w-sm w-full">
        {/* Header strip: emoji + topic */}
        <div className="flex items-center gap-2">
          <span className="text-3xl">{card.emoji}</span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-widest">
            <BarChart3 className="w-3 h-3" />
            {card.topic}
          </span>
        </div>

        {/* Title + hook — context the user expected to see after tapping right */}
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
            {card.title}
          </h2>
          <p className="text-sm text-zinc-200 font-medium italic leading-snug">
            &ldquo;{card.hook}&rdquo;
          </p>
        </div>

        {/* Hero number — the impact value */}
        <div className="space-y-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
            {card.impactLabel}
          </div>
          <div className="text-4xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-emerald-200 to-emerald-500 tabular-nums">
            {card.impactValue}
          </div>
        </div>

        {/* Data bars */}
        {card.visualData && card.visualData.length > 0 && (
          <div className="w-full space-y-3 pt-2">
            {card.visualData.map((d) => (
              <div key={d.label} className="space-y-1">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-zinc-100 font-medium text-left">{d.label}</span>
                  <span className="text-white font-extrabold tabular-nums">{d.value}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-[width] duration-1000 ease-out"
                    style={{ width: isActive ? `${d.percent}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
