"use client";

import { useMemo } from "react";
import { CheckCircle, Circle, Lock } from "lucide-react";
import { CARDS } from "@/lib/learn/cards";
import { MINI_SERIES, isUnlocked, progressFor } from "@/lib/learn/miniSeries";
import type { Level } from "@/lib/learn/types";

interface Props {
  completedIds: (string | number)[];
}

const LEVEL_ORDER: Level[] = ["Beginner", "Intermediate", "Advanced", "Quant"];
const LEVEL_EMOJI: Record<Level, string> = {
  Beginner: "🌱",
  Intermediate: "📈",
  Advanced: "🔬",
  Quant: "⚡",
};

export function KnowledgeTree({ completedIds }: Props) {
  const completedSet = useMemo(
    () => new Set(completedIds.map(String)),
    [completedIds]
  );

  const completedByLevel = useMemo(() => {
    const m: Record<string, number> = {};
    for (const id of completedIds) {
      const c = CARDS.find((c) => String(c.id) === String(id));
      if (c) m[c.level] = (m[c.level] ?? 0) + 1;
    }
    return m;
  }, [completedIds]);

  const byLevel = useMemo(() => {
    const m: Record<Level, typeof CARDS[number][]> = {
      Beginner: [],
      Intermediate: [],
      Advanced: [],
      Quant: [],
    };
    for (const c of CARDS) m[c.level].push(c);
    return m;
  }, []);

  return (
    <div className="space-y-5">
      {/* Concept lattice */}
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 px-1">
          Knowledge Tree
        </h3>

        {LEVEL_ORDER.map((level) => {
          const cards = byLevel[level];
          const mastered = cards.filter((c) => completedSet.has(String(c.id))).length;
          return (
            <div
              key={level}
              className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{LEVEL_EMOJI[level]}</span>
                  <div>
                    <div className="text-sm font-extrabold text-zinc-100">{level}</div>
                    <div className="text-[10px] text-zinc-500">
                      {mastered} of {cards.length} mastered
                    </div>
                  </div>
                </div>
                <div className="text-xs font-black text-emerald-400">
                  {cards.length > 0 ? Math.round((mastered / cards.length) * 100) : 0}%
                </div>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                  style={{ width: `${cards.length > 0 ? (mastered / cards.length) * 100 : 0}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {cards.map((c) => {
                  const done = completedSet.has(String(c.id));
                  return (
                    <div
                      key={c.id}
                      title={c.title}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] border ${
                        done
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                          : "bg-zinc-950 border-zinc-800 text-zinc-600"
                      }`}
                    >
                      {done ? (
                        <CheckCircle className="w-2.5 h-2.5" />
                      ) : (
                        <Circle className="w-2.5 h-2.5" />
                      )}
                      <span>{c.emoji}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mini-series unlocks */}
      <div className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 px-1">
          Mini-Series Paths
        </h3>
        <div className="space-y-2">
          {MINI_SERIES.map((s) => {
            const unlocked = isUnlocked(s, completedIds, completedByLevel);
            const prog = progressFor(s, completedIds);
            return (
              <div
                key={s.id}
                className={`rounded-2xl border p-3 flex items-center gap-3 ${
                  unlocked
                    ? "bg-violet-500/5 border-violet-500/30"
                    : "bg-zinc-900 border-zinc-800 opacity-60"
                }`}
              >
                <div className="text-2xl shrink-0">
                  {unlocked ? s.emoji : <Lock className="w-5 h-5 text-zinc-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-extrabold text-zinc-100 truncate">{s.title}</div>
                  <div className="text-[10px] text-zinc-500 mb-1 truncate">
                    {s.description}
                  </div>
                  {unlocked ? (
                    <div className="flex items-center gap-2">
                      <div className="h-1 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-400"
                          style={{ width: `${prog.ratio * 100}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-violet-300 shrink-0">
                        {prog.done}/{prog.total}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[9px] text-zinc-600">
                      {s.prerequisite.minCompletedCount && (
                        <>Master {s.prerequisite.minCompletedCount}+ cards to unlock</>
                      )}
                      {s.prerequisite.minCompletedLevel && s.prerequisite.completedLevelCount && (
                        <>
                          Master {s.prerequisite.completedLevelCount}+{" "}
                          {s.prerequisite.minCompletedLevel} cards to unlock
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
