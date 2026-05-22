"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Lock } from "lucide-react";
import type { Card } from "@/lib/learn/types";
import { CARDS } from "@/lib/learn/cards";
import { MINI_SERIES, isUnlocked, progressFor } from "@/lib/learn/miniSeries";
import { dueCardIds, recordFailure, recordPass } from "@/lib/learn/spacedRepetition";
import { StoryCard } from "./learn/StoryCard";
import { ReadingView } from "./learn/ReadingView";
import { VisualizeView } from "./learn/VisualizeView";
import { AudioModeView } from "./learn/AudioModeView";
import { ModeToggle, type LearnMode } from "./learn/ModeToggle";
import { AudioToggle, readAudioEnabled, writeAudioEnabled } from "./learn/AudioToggle";
import { readOnboarding, type Struggle } from "./OnboardingModal";
import { pushStateDebounced } from "@/lib/cloudSync";

const STORAGE_KEY = (uid: string) => `finscroll_v3_${uid}`;
const MODE_STORAGE_KEY = "finscroll_learn_mode";

interface FinTokFeedProps {
  userId?: string;
}

const STRUGGLE_TO_START_CARD: Record<Struggle, number> = {
  saving: 0,
  debt: 1,
  investing: 4,
  all: 0,
};

interface PersistedProgress {
  completed?: Record<string, boolean>;
  quizAnswers?: Record<string, number>;
  weeklyLog?: number[];
}

export function FinTokFeed({ userId = "guest" }: FinTokFeedProps) {
  const [active, setActive] = useState(0);
  const [mode, setMode] = useState<LearnMode>("story");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const feedRef = useRef<HTMLDivElement>(null);

  // ── Load persisted state on mount ────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(userId));
      if (raw) {
        const s: PersistedProgress = JSON.parse(raw);
        if (s.completed) setCompleted(s.completed);
        if (s.quizAnswers) setQuizAnswers(s.quizAnswers);
      }
    } catch {}
    setAudioEnabled(readAudioEnabled());
    try {
      const m = localStorage.getItem(MODE_STORAGE_KEY) as LearnMode | null;
      if (m && ["story", "read", "visualize", "audio"].includes(m)) {
        setMode(m);
      }
    } catch {}
  }, [userId]);

  const persist = useCallback(
    (updates: Partial<PersistedProgress>) => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY(userId)) ?? "{}";
        const merged = { ...JSON.parse(raw), ...updates };
        localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(merged));
      } catch {}
      pushStateDebounced(userId);
    },
    [userId]
  );

  // ── Build the card order: due-for-review first, then onboarding-picked start ──
  const cardOrder = useMemo(() => {
    const due = dueCardIds(userId);
    const dueSet = new Set(due.map(String));
    const dueCards = due
      .map((id) => CARDS.find((c) => String(c.id) === String(id)))
      .filter((c): c is Card => !!c);
    const remaining = CARDS.filter((c) => !dueSet.has(String(c.id)));
    return [...dueCards, ...remaining];
  }, [userId]);

  // ── First-time visitors: scroll to the card matching their struggle ──
  useEffect(() => {
    if (mode !== "story") return;
    try {
      const onboarding = readOnboarding(userId);
      const previousSession = localStorage.getItem(STORAGE_KEY(userId));
      const isFirstVisit = !previousSession;
      if (onboarding && isFirstVisit && feedRef.current) {
        const targetIdx = STRUGGLE_TO_START_CARD[onboarding.struggle] ?? 0;
        if (targetIdx > 0 && targetIdx < cardOrder.length) {
          requestAnimationFrame(() => {
            if (feedRef.current) {
              feedRef.current.scrollTop = feedRef.current.clientHeight * targetIdx;
              setActive(targetIdx);
            }
          });
        }
      }
    } catch {}
  }, [userId, mode, cardOrder.length]);

  // ── Scroll handler ───────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    if (!feedRef.current) return;
    const idx = Math.round(
      feedRef.current.scrollTop / feedRef.current.clientHeight
    );
    if (idx !== active && idx >= 0 && idx < cardOrder.length) setActive(idx);
  }, [active, cardOrder.length]);

  // ── Quiz answer handler ──────────────────────────────────────────
  const handleAnswer = (cardId: string | number, idx: number) => {
    const card = cardOrder.find((c) => String(c.id) === String(cardId));
    if (!card) return;
    const key = String(cardId);

    setQuizAnswers((prev) => ({ ...prev, [key]: idx }));

    const isCorrect = idx === card.quiz.correctIndex;

    if (isCorrect && !completed[key]) {
      const nextCompleted = { ...completed, [key]: true };
      setCompleted(nextCompleted);
      recordPass(userId, cardId);

      const weeklyLogEntry = Date.now();
      try {
        const raw = localStorage.getItem(STORAGE_KEY(userId)) ?? "{}";
        const existing: PersistedProgress = JSON.parse(raw);
        const weeklyLog: number[] = Array.isArray(existing.weeklyLog)
          ? existing.weeklyLog
          : [];
        weeklyLog.push(weeklyLogEntry);
        persist({
          completed: nextCompleted,
          quizAnswers: { ...quizAnswers, [key]: idx },
          weeklyLog,
        });
      } catch {
        persist({ completed: nextCompleted, quizAnswers: { ...quizAnswers, [key]: idx } });
      }

      // Update streak (unchanged from previous behavior)
      try {
        const today = new Date().toDateString();
        const last = localStorage.getItem("fs_streak_date");
        const streak = parseInt(localStorage.getItem("fs_streak") ?? "0", 10);
        if (last !== today) {
          const yesterday = new Date(Date.now() - 86400000).toDateString();
          localStorage.setItem(
            "fs_streak",
            (last === yesterday ? streak + 1 : 1).toString()
          );
          localStorage.setItem("fs_streak_date", today);
        }
      } catch {}
    } else if (!isCorrect) {
      recordFailure(userId, cardId);
      persist({ quizAnswers: { ...quizAnswers, [key]: idx } });
    }
  };

  // ── Jump to a related card ───────────────────────────────────────
  const jumpToCard = useCallback(
    (cardId: string | number) => {
      const idx = cardOrder.findIndex((c) => String(c.id) === String(cardId));
      if (idx >= 0 && feedRef.current) {
        feedRef.current.scrollTop = feedRef.current.clientHeight * idx;
        setActive(idx);
      }
    },
    [cardOrder]
  );

  // ── Audio toggle ─────────────────────────────────────────────────
  const handleAudioToggle = (next: boolean) => {
    setAudioEnabled(next);
    writeAudioEnabled(next);
  };

  // ── Mode change ──────────────────────────────────────────────────
  const handleModeChange = (m: LearnMode) => {
    setMode(m);
    try {
      localStorage.setItem(MODE_STORAGE_KEY, m);
    } catch {}
  };

  // ── Mini-series banner ───────────────────────────────────────────
  const completedIds = Object.entries(completed)
    .filter(([, v]) => v)
    .map(([k]) => k);
  const completedByLevel = useMemo(() => {
    const map: Record<string, number> = {};
    for (const id of completedIds) {
      const c = CARDS.find((c) => String(c.id) === id);
      if (c) map[c.level] = (map[c.level] ?? 0) + 1;
    }
    return map;
  }, [completedIds]);

  const unlockedSeries = useMemo(
    () => MINI_SERIES.filter((s) => isUnlocked(s, completedIds, completedByLevel)),
    [completedIds, completedByLevel]
  );

  const dueCount = dueCardIds(userId).length;
  const completedCount = completedIds.length;

  return (
    <div className="h-full w-full relative bg-zinc-950">
      {/* Top HUD: brand + mode toggle + audio toggle */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 pt-safe pt-3 pb-2 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="text-white font-black text-sm tracking-tight">FinScroll</span>
          {dueCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[8px] font-black uppercase tracking-widest">
              {dueCount} review
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <ModeToggle current={mode} onChange={handleModeChange} />
          <AudioToggle enabled={audioEnabled} onToggle={handleAudioToggle} />
          <div className="flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-full border border-zinc-700/50">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400">
              {completedCount}/{CARDS.length}
            </span>
          </div>
        </div>
      </div>

      {/* Mode-switched body */}
      {mode === "story" && (
        <div
          ref={feedRef}
          onScroll={handleScroll}
          className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
        >
          {cardOrder.map((card, idx) => (
            <StoryCard
              key={card.id}
              card={card}
              userId={userId}
              isActive={active === idx}
              audioEnabled={audioEnabled}
              quizAnswer={quizAnswers[String(card.id)] ?? null}
              onAnswer={handleAnswer}
              onJumpToCard={jumpToCard}
            />
          ))}

          {/* Mini-series banner at end of feed */}
          {unlockedSeries.length > 0 && (
            <div
              className="relative w-full snap-start shrink-0 flex flex-col items-center justify-center px-6 bg-gradient-to-b from-violet-900 via-zinc-900 to-zinc-950"
              style={{ height: "100dvh" }}
            >
              <div className="relative z-10 max-w-sm space-y-5">
                <div className="text-center space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-violet-300">
                    🎁 You unlocked
                  </span>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    Mini-series
                  </h3>
                </div>
                {unlockedSeries.map((s) => {
                  const prog = progressFor(s, completedIds);
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        const firstUndone = s.cardIds.find(
                          (id) => !completed[String(id)]
                        );
                        if (firstUndone) jumpToCard(firstUndone);
                      }}
                      className="w-full p-4 rounded-2xl bg-zinc-900 border border-violet-500/30 hover:border-violet-500/50 text-left space-y-2 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{s.emoji}</span>
                        <div>
                          <div className="font-extrabold text-white text-sm">{s.title}</div>
                          <div className="text-[10px] text-zinc-400">{s.description}</div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold">
                          <span className="text-violet-300">Progress</span>
                          <span className="text-zinc-200">{prog.done} / {prog.total}</span>
                        </div>
                        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-400 to-violet-500"
                            style={{ width: `${prog.ratio * 100}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Locked-series teaser */}
          {unlockedSeries.length < MINI_SERIES.length && (
            <div
              className="relative w-full snap-start shrink-0 flex flex-col items-center justify-center px-6 bg-zinc-950"
              style={{ height: "100dvh" }}
            >
              <div className="relative z-10 max-w-sm space-y-4 text-center">
                <Lock className="w-10 h-10 text-zinc-600 mx-auto" />
                <h3 className="text-lg font-extrabold text-zinc-300">
                  More mini-series unlock as you learn
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Master more concepts to unlock curated paths like Debt Killer, First
                  Investment Playbook, and Tax-Advantaged Stack.
                </p>
                <div className="text-[10px] text-zinc-600 font-bold">
                  {completedCount} of {CARDS.length} concepts mastered
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === "read" && <ReadingView cards={cardOrder} onSelectCard={jumpToCard} />}
      {mode === "visualize" && <VisualizeView cards={cardOrder} />}
      {mode === "audio" && <AudioModeView cards={cardOrder} />}
    </div>
  );
}
