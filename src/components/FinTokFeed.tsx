"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Lock, HelpCircle } from "lucide-react";
import type { Card } from "@/lib/learn/types";
import { CARDS, POOL_CARDS } from "@/lib/learn/cards";
import { MINI_SERIES, isUnlocked, progressFor } from "@/lib/learn/miniSeries";
import { dueCardIds, recordFailure, recordPass } from "@/lib/learn/spacedRepetition";
import { StoryCard } from "./learn/StoryCard";
import { ReadingView } from "./learn/ReadingView";
import { AudioModeView } from "./learn/AudioModeView";
import { FeedTutorial } from "./learn/FeedTutorial";
import { SwipeHint } from "./learn/SwipeHint";
import { SkeletonCard } from "./learn/SkeletonCard";
import { ModeToggle, type LearnMode } from "./learn/ModeToggle";
import { AudioToggle, readAudioEnabled, writeAudioEnabled } from "./learn/AudioToggle";
import { readOnboarding, type Struggle } from "./OnboardingModal";
import { pushStateDebounced } from "@/lib/cloudSync";
import { useInfiniteCards } from "@/lib/learn/useInfiniteCards";

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

const STORY_FRAME_COUNT = 5;

export function FinTokFeed({ userId = "guest" }: FinTokFeedProps) {
  const [active, setActive] = useState(0);
  const [activeFrame, setActiveFrame] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [replayTutorial, setReplayTutorial] = useState(false);
  const [mode, setMode] = useState<LearnMode>("story");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [dailyCard, setDailyCard] = useState<Card | null>(null);
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
      const m = localStorage.getItem(MODE_STORAGE_KEY);
      if (m && ["story", "read", "audio"].includes(m)) {
        setMode(m as LearnMode);
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

  // ── Fetch today's auto-generated daily card. Cached client-side by the
  // YYYY-MM-DD dateKey so we don't re-fetch on the same day. The server is
  // also cached per-day per-instance, so the first hit pays the LLM cost
  // and every subsequent caller gets it instantly. ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const today = new Date();
        const dateKey = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;
        const cacheKey = `fs_daily_${dateKey}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as Card;
            if (!cancelled) setDailyCard(parsed);
            return;
          } catch {}
        }
        const res = await fetch("/api/cards/daily", { method: "GET" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data?.card) return;
        setDailyCard(data.card as Card);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data.card));
        } catch {}
      } catch {
        // Silent fail — feed still works without the daily drop
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Build the card order. Sequence:
  //   1. Today's auto-generated daily drop (if loaded) — fresh content first
  //   2. Due-for-review curated cards — spaced-repetition takes priority
  //   3. Remaining curated cards (1–12) — the hand-written core
  //   4. Pool cards — RAG-generated, offline pre-baked. Free-tier safe
  //      because they were generated once and ship as static JSON.
  //
  // POOL_CARDS deliberately come after curated content so reviewers see
  // the polished cards first; pool cards extend the feed for users who
  // scroll deep. Mini-series only references numeric ids (1–12), so pool
  // cards never affect mini-series progress.
  const baseOrder = useMemo(() => {
    const due = dueCardIds(userId);
    const dueSet = new Set(due.map(String));
    const dueCards = due
      .map((id) => CARDS.find((c) => String(c.id) === String(id)))
      .filter((c): c is Card => !!c);
    const remaining = CARDS.filter((c) => !dueSet.has(String(c.id)));
    const curated = [...dueCards, ...remaining, ...POOL_CARDS];
    return dailyCard ? [dailyCard, ...curated] : curated;
  }, [userId, dailyCard]);

  // ── Infinite feed: fetch RAG-generated cards as user nears the end.
  // Falls back silently to recycling baseOrder if the API is rate-limited
  // or generation fails — see useInfiniteCards for the fallback policy. ──
  const {
    extraCards,
    isLoading: isLoadingMore,
    fallback: infiniteFallback,
  } = useInfiniteCards({
    activeIndex: active,
    baseLength: baseOrder.length,
    prefetchAhead: 2,
    enabled: mode === "story",
  });

  const cardOrder = useMemo(() => {
    // Just concatenate base + any RAG-generated extras. When the API is
    // in cooldown (fallback=true) and we have no extras yet, the feed
    // gracefully stops at the base length — the user sees the existing
    // 12 + daily cards and the mini-series banner at the end. Recycling
    // the base would create duplicate keys (every card.id appears twice)
    // and React refuses to render that.
    return [...baseOrder, ...extraCards];
  }, [baseOrder, extraCards]);

  // Surface the fallback state in the console only — no UI yet. If we
  // want a "you've finished everything" message later, this is where we'd
  // hang it off.
  if (process.env.NODE_ENV === "development" && infiniteFallback) {
    // eslint-disable-next-line no-console
    console.debug("[FinTokFeed] Infinite-card API in cooldown — using base feed only.");
  }

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
    // First user-initiated scroll dismisses the swipe-up hint
    if (feedRef.current.scrollTop > 4) setHasScrolled(true);
  }, [active, cardOrder.length]);

  // ── Quiz answer handler ──────────────────────────────────────────
  // useCallback so React.memo on StoryCard doesn't see a fresh function
  // identity each render and re-render unnecessarily.
  const handleAnswer = useCallback((cardId: string | number, idx: number) => {
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
  }, [cardOrder, completed, persist, quizAnswers, userId]);

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
      {/* Top HUD: brand + mode toggle + audio toggle. Lives outside the
          scrollable feed so it stays sticky during snap transitions.
          Solid zinc-950 background prevents the previous card's bottom
          controls from bleeding through during mid-snap scroll states. */}
      <div className="absolute top-0 left-0 right-0 z-40 px-3 pt-safe pt-3 pb-2 bg-zinc-950 border-b border-zinc-900">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 pointer-events-auto">
            <span className="text-white font-black text-sm tracking-tight">FinScroll</span>
            {/* Replay-tutorial button — visible in every mode so users can
                always get help, not just in Story. Tapping it switches the
                feed to Story mode (where gestures apply) and opens the
                tutorial overlay. */}
            <button
              onClick={() => {
                if (mode !== "story") handleModeChange("story");
                setReplayTutorial((v) => !v);
              }}
              aria-label="Replay tutorial"
              title="How to use FinScroll"
              className="p-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-zinc-700/50 text-zinc-300 hover:text-emerald-300 hover:border-emerald-500/40 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
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
        {/* Per-card frame progress (only meaningful in story mode) */}
        {mode === "story" && (
          <div className="flex items-center gap-1 mt-2">
            {Array.from({ length: STORY_FRAME_COUNT }).map((_, i) => (
              <div
                key={i}
                className={`h-0.5 flex-1 rounded-full transition-colors duration-500 ${
                  i < activeFrame
                    ? "bg-emerald-400"
                    : i === activeFrame
                    ? "bg-white"
                    : "bg-white/15"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mode-switched body */}
      {mode === "story" && (
        <div
          ref={feedRef}
          onScroll={handleScroll}
          className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
        >
          {cardOrder.map((card, idx) => {
            // Virtualization: only fully render the active card plus its
            // immediate neighbors. The rest stay as size-preserving placeholders
            // so snap positions stay correct, but skip the iframe/Lottie/etc.
            // payload. Drops 9 of 12 cards' work per scroll frame.
            //
            // Key is `idx-card.id` (not just card.id) so React doesn't choke
            // when the feed legitimately contains two cards with the same id
            // — e.g. an RAG-generated card that happened to be assigned an
            // id colliding with the curated set, or any future recycling
            // strategy that re-uses cards.
            const key = `${idx}-${card.id}`;
            const distance = Math.abs(idx - active);
            const visible = distance <= 1;
            if (!visible) {
              return (
                <div
                  key={key}
                  className="relative w-full h-full snap-start shrink-0 bg-zinc-950"
                  aria-hidden="true"
                />
              );
            }
            return (
              <StoryCard
                key={key}
                card={card}
                userId={userId}
                isActive={active === idx}
                audioEnabled={audioEnabled}
                quizAnswer={quizAnswers[String(card.id)] ?? null}
                onAnswer={handleAnswer}
                onJumpToCard={jumpToCard}
                onFrameChange={setActiveFrame}
              />
            );
          })}

          {/* Skeleton card — slots in when a fresh RAG card is being
              fetched. Only shown when the user is within 1 card of the
              end so we don't waste a snap-stop in the middle of the feed.
              Once the new card arrives it appends to cardOrder and the
              skeleton naturally moves further down. */}
          {isLoadingMore && active >= cardOrder.length - 2 && (
            <SkeletonCard />
          )}

          {/* Mini-series banner at end of feed */}
          {unlockedSeries.length > 0 && (
            <div
              className="relative w-full h-full snap-start shrink-0 flex flex-col items-center justify-center px-6 bg-gradient-to-b from-violet-900 via-zinc-900 to-zinc-950"
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
              className="relative w-full h-full snap-start shrink-0 flex flex-col items-center justify-center px-6 bg-zinc-950"
            >
              <div className="relative z-10 max-w-sm space-y-4 text-center">
                <Lock className="w-10 h-10 text-zinc-400 mx-auto" />
                <h3 className="text-lg font-extrabold text-white">
                  More mini-series unlock as you learn
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Master more concepts to unlock curated paths like Debt Killer, First
                  Investment Playbook, and Tax-Advantaged Stack.
                </p>
                <div className="text-[10px] text-zinc-400 font-bold">
                  {completedCount} of {CARDS.length} concepts mastered
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === "read" && <ReadingView cards={cardOrder} onSelectCard={jumpToCard} />}
      {mode === "audio" && <AudioModeView cards={cardOrder} />}

      {/* First-time gestures tutorial. Renders only in story mode where the
          gestures actually apply. Self-gates via localStorage on first run;
          can be re-triggered any time via the ? button in the HUD. */}
      {mode === "story" && (
        <FeedTutorial
          open={replayTutorial}
          onClose={() => setReplayTutorial(false)}
        />
      )}

      {/* Persistent nudge to swipe up for the next card. Disappears the moment
          the user scrolls, or after a brief auto-hide. */}
      {mode === "story" && (
        <SwipeHint isFirstCard={active === 0} hasScrolled={hasScrolled} />
      )}
    </div>
  );
}
