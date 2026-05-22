"use client";

import type { Card } from "@/lib/learn/types";
import { BookOpen, ExternalLink, ChevronRight } from "lucide-react";

interface Props {
  cards: readonly Card[];
  onSelectCard?: (cardId: string | number) => void;
}

/**
 * Reading mode renders ALL cards as a single long-form scrollable article.
 * Same content, completely different presentation. For users who learn
 * better through text than through swipe-based stories.
 */
export function ReadingView({ cards, onSelectCard }: Props) {
  return (
    <div className="h-full overflow-y-auto bg-zinc-950">
      <article className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        <header className="pb-4 border-b border-zinc-800">
          <h1 className="text-2xl font-black text-zinc-50 tracking-tight">
            FinTok Library
          </h1>
          <p className="text-xs text-zinc-500 mt-1.5">
            {cards.length} concepts · grounded in SEC and peer-reviewed research
          </p>
        </header>

        {cards.map((card, i) => (
          <section key={card.id} id={`card-${card.id}`} className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl">{card.emoji}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                {card.level}
              </span>
              <span className="text-[10px] text-zinc-500">·</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                {card.topic}
              </span>
              <span className="ml-auto text-[10px] text-zinc-600 font-mono">{i + 1}/{cards.length}</span>
            </div>

            <h2 className="text-lg font-extrabold text-zinc-100 tracking-tight">
              {card.title}
            </h2>

            <p className="text-sm text-zinc-300 leading-relaxed italic">
              &ldquo;{card.hook}&rdquo;
            </p>

            <p className="text-sm text-zinc-200 leading-relaxed">{card.keyFact}</p>

            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-baseline justify-between">
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400">
                {card.impactLabel}
              </span>
              <span className="text-base font-black text-emerald-300 tracking-tight">
                {card.impactValue}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-sky-400 font-bold">
              <BookOpen className="w-3 h-3" />
              <span>{card.source.name}</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </div>

            {onSelectCard && (
              <button
                onClick={() => onSelectCard(card.id)}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
              >
                Quiz yourself on this concept <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </section>
        ))}
      </article>
    </div>
  );
}
