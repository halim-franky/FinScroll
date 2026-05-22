"use client";

import type { Card } from "@/lib/learn/types";
import { CheckCircle, XCircle, MessageSquare } from "lucide-react";

interface Props {
  card: Card;
  answer: number | null;
  onAnswer: (idx: number) => void;
}

export function QuizFrame({ card, answer, onAnswer }: Props) {
  const answered = answer !== null && answer !== undefined;
  const isCorrect = answer === card.quiz.correctIndex;

  return (
    <div className="flex flex-col h-full px-5 py-6 gap-4 animate-fadeIn">
      <div className="space-y-2 text-center">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[9px] font-black uppercase tracking-widest">
          <MessageSquare className="w-3 h-3" /> Knowledge Check
        </span>
        <p className="text-white text-sm font-bold leading-snug px-2">{card.quiz.question}</p>
      </div>

      <div className="space-y-2 flex-1">
        {card.quiz.options.map((opt, oi) => {
          let cls = "bg-black/50 border-zinc-700 text-zinc-200 hover:border-zinc-500";
          if (answered) {
            if (oi === card.quiz.correctIndex) cls = "bg-emerald-500/20 border-emerald-500 text-emerald-200";
            else if (oi === answer) cls = "bg-rose-500/20 border-rose-500 text-rose-300";
            else cls = "bg-black/30 border-zinc-800 text-zinc-600";
          }
          return (
            <button
              key={oi}
              disabled={answered}
              onClick={() => onAnswer(oi)}
              className={`w-full text-left text-xs font-semibold px-3 py-3 rounded-xl border transition-all ${cls}`}
            >
              <span className="mr-2 text-zinc-500 font-mono">{String.fromCharCode(65 + oi)}.</span>
              {opt}
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          className={`p-3 rounded-xl border text-[11px] leading-relaxed ${
            isCorrect
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
              : "bg-rose-500/10 border-rose-500/30 text-rose-200"
          }`}
        >
          <div className="flex items-center gap-1.5 font-black mb-1">
            {isCorrect ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" /> Correct! +1 concept mastered
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5" /> Not quite — we&apos;ll bring this back in 3 days
              </>
            )}
          </div>
          {card.quiz.explanation}
        </div>
      )}
    </div>
  );
}
