"use client";

import { useMemo } from "react";
import { BookOpen, ExternalLink, GitBranch, ChevronRight } from "lucide-react";
import type { Card } from "@/lib/learn/types";
import { NotesInput } from "../NotesInput";
import { CARDS } from "@/lib/learn/cards";

interface Props {
  card: Card;
  userId: string;
  onJumpToCard: (cardId: string | number) => void;
}

export function ActionFrame({ card, userId, onJumpToCard }: Props) {
  const related = useMemo(() => {
    if (!card.relatedCardIds || card.relatedCardIds.length === 0) return [];
    return card.relatedCardIds
      .map((id) => CARDS.find((c) => String(c.id) === String(id)))
      .filter((c): c is Card => !!c)
      .slice(0, 3);
  }, [card.relatedCardIds]);

  return (
    <div className="flex flex-col h-full px-5 py-6 gap-4 overflow-y-auto animate-fadeIn">
      <NotesInput userId={userId} cardId={card.id} />

      {/* Source */}
      <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
        <div className="flex items-center gap-1.5 text-[8px] font-black text-emerald-400 tracking-widest uppercase mb-1.5">
          <BookOpen className="w-3 h-3" /> Grounded source
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-sky-400 font-bold">
          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
          <span className="truncate">{card.source.name}</span>
        </div>
      </div>

      {/* Concept connections */}
      {related.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400">
            <GitBranch className="w-3 h-3" /> Continue Learning
          </div>
          <div className="space-y-1.5">
            {related.map((r) => (
              <button
                key={r.id}
                onClick={() => onJumpToCard(r.id)}
                className="w-full flex items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">{r.emoji}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-200 truncate">{r.title}</div>
                    <div className="text-[9px] text-zinc-500">{r.topic}</div>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
