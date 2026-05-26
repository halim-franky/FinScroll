"use client";

import type { Card } from "@/lib/learn/types";
import { BookOpen, ExternalLink, ChevronRight } from "lucide-react";

interface Props {
  cards: readonly Card[];
  onSelectCard?: (cardId: string | number) => void;
}

/**
 * Reading mode renders ALL cards as a long-form library.
 *
 * Each concept lives in its own bordered card with a subtle background so
 * the user can clearly see where one topic ends and the next begins. A
 * gradient accent strip on the left edge of each card uses the card's
 * own theme colour, making the library feel rhythmic to scroll.
 */
export function ReadingView({ cards, onSelectCard }: Props) {
  return (
    <div className="h-full overflow-y-auto bg-zinc-950">
      <article className="max-w-2xl mx-auto px-4 pt-16 pb-8">
        <header className="pb-4 mb-6 border-b border-zinc-800">
          <h1 className="text-2xl font-black text-zinc-50 tracking-tight">
            FinScroll Library
          </h1>
          <p className="text-xs text-zinc-400 mt-1.5">
            {cards.length} concepts · grounded in SEC and peer-reviewed research
          </p>
        </header>

        <div className="space-y-5">
          {cards.map((card, i) => (
            <section
              // Index-prefixed key — defense-in-depth against duplicate
              // card ids reaching this component (parent dedupes too).
              key={`${i}-${card.id}`}
              id={`card-${card.id}`}
              className="relative rounded-2xl bg-zinc-900/50 border border-zinc-800 p-5 space-y-3 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
            >
              {/* Accent strip — pulls in the card's signature gradient so each
                  topic has a unique visual fingerprint at a glance. */}
              <div
                className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${card.gradient}`}
                aria-hidden="true"
              />

              {/* Header row: emoji + level/topic chips + counter */}
              <div className="flex items-center gap-2 flex-wrap pl-1">
                <span className="text-2xl shrink-0">{card.emoji}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  {card.level}
                </span>
                <span className="text-[10px] text-zinc-400">·</span>
                <span className="text-[10px] text-zinc-300 uppercase tracking-widest font-bold">
                  {card.topic}
                </span>
                <span className="ml-auto text-[10px] text-zinc-400 font-mono tabular-nums">
                  {i + 1}/{cards.length}
                </span>
              </div>

              <h2 className="text-lg font-extrabold text-zinc-100 tracking-tight pl-1">
                {card.title}
              </h2>

              <p className="text-sm text-zinc-300 leading-relaxed italic pl-1">
                &ldquo;{card.hook}&rdquo;
              </p>

              <p className="text-sm text-zinc-200 leading-relaxed pl-1">
                {card.keyFact}
              </p>

              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-baseline justify-between">
                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400">
                  {card.impactLabel}
                </span>
                <span className="text-base font-black text-emerald-300 tracking-tight">
                  {card.impactValue}
                </span>
              </div>

              {/* Footer row: source (left, truncates) + quiz CTA (right, fixed) */}
              <div className="flex items-center justify-between gap-3 pt-1 pl-1">
                <a
                  href={card.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={card.source.name}
                  className="flex-1 min-w-0 inline-flex items-center gap-1.5 text-[11px] text-sky-400 hover:text-sky-300 font-bold transition-colors"
                >
                  <BookOpen className="w-3 h-3 shrink-0" />
                  <span className="truncate underline-offset-2 hover:underline">
                    {card.source.name}
                  </span>
                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                </a>

                {onSelectCard && (
                  <button
                    onClick={() => onSelectCard(card.id)}
                    className="shrink-0 text-[11px] text-emerald-300 hover:text-emerald-200 font-bold flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/15 transition-colors"
                  >
                    Quiz yourself
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
