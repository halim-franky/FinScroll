"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Flame, Trophy, Clock, DollarSign, Share2, Copy, Check,
  Target, Sparkles, BarChart3,
} from "lucide-react";
import {
  CURRENT_CHALLENGE, countThisWeek, formatTimeUntilReset,
} from "@/lib/weeklyChallenge";

const STORAGE_KEY = (uid: string) => `finscroll_v2_${uid}`;
const HOURLY_VALUE = 3; // matches SessionNudge math

interface FeedState {
  liked?: Record<string, boolean>;
  saved?: Record<string, boolean>;
  completed?: Record<string, boolean>;
  weeklyLog?: number[];
}

interface Props {
  userId: string;
}

export function StatsView({ userId }: Props) {
  const [feedState, setFeedState] = useState<FeedState>({});
  const [streak, setStreak] = useState(0);
  const [shareStatus, setShareStatus] = useState<"idle" | "shared" | "copied" | "error">("idle");
  const [origin, setOrigin] = useState("");

  // Load all persisted state on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(userId));
      if (raw) setFeedState(JSON.parse(raw));
      const s = localStorage.getItem("fs_streak");
      if (s) setStreak(parseInt(s, 10));
      setOrigin(window.location.origin);
    } catch {}
  }, [userId]);

  // Reset share status after a moment
  useEffect(() => {
    if (shareStatus === "idle") return;
    const id = setTimeout(() => setShareStatus("idle"), 2500);
    return () => clearTimeout(id);
  }, [shareStatus]);

  const completedCount = useMemo(
    () => Object.values(feedState.completed ?? {}).filter(Boolean).length,
    [feedState.completed]
  );

  const weeklyLog = useMemo(
    () => (Array.isArray(feedState.weeklyLog) ? feedState.weeklyLog : []),
    [feedState.weeklyLog]
  );

  const thisWeekCount = useMemo(() => countThisWeek(weeklyLog), [weeklyLog]);
  const challengeProgress = Math.min(thisWeekCount / CURRENT_CHALLENGE.goal, 1);
  const challengeMet = thisWeekCount >= CURRENT_CHALLENGE.goal;

  // Estimate: each correct quiz = ~3 minutes of focused learning → $3/hr × time
  const estimatedMinutes = completedCount * 3 + streak * 5;
  const estimatedSaved = (estimatedMinutes / 60) * HOURLY_VALUE;

  const shareText = `Day ${streak || 1} of replacing TikTok finance hype with real SEC-grounded financial literacy on FinScroll 🔥📈

${completedCount} concepts mastered. Building wealth instead of doomscrolling.`;

  const handleShare = async () => {
    if (typeof navigator === "undefined") return;
    const payload = {
      title: "FinScroll",
      text: shareText,
      url: origin || "https://github.com/halim-franky/FinScroll",
    };
    try {
      if ("share" in navigator && typeof navigator.share === "function") {
        await navigator.share(payload);
        setShareStatus("shared");
      } else {
        await navigator.clipboard.writeText(`${shareText}\n\n${payload.url}`);
        setShareStatus("copied");
      }
    } catch (err) {
      // User cancelled share — not an error
      const cancelled = err instanceof Error && err.name === "AbortError";
      if (!cancelled) setShareStatus("error");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${origin}`);
      setShareStatus("copied");
    } catch {
      setShareStatus("error");
    }
  };

  return (
    <div className="space-y-5">

      {/* ── Streak Hero ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-700 via-rose-900 to-zinc-950 border border-orange-500/30 p-6 shadow-[0_10px_30px_rgba(251,113,133,0.15)]">
        <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-xs font-black uppercase tracking-widest text-orange-300">
              Current Streak
            </span>
          </div>
          <div className="text-6xl font-black tracking-tighter text-white leading-none">
            {streak}
            <span className="text-2xl text-orange-300 font-bold ml-2">
              {streak === 1 ? "day" : "days"}
            </span>
          </div>
          <p className="text-sm text-orange-100/80 mt-2">
            {streak === 0
              ? "Master a concept today to start your streak."
              : `Don't break the chain. Come back tomorrow to keep it alive.`}
          </p>
        </div>
      </div>

      {/* ── Stats Grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          icon={Trophy}
          color="emerald"
          value={`${completedCount}`}
          label="Concepts mastered"
        />
        <StatCard
          icon={Clock}
          color="sky"
          value={`${Math.floor(estimatedMinutes / 60)}h ${estimatedMinutes % 60}m`}
          label="Time learning"
        />
        <StatCard
          icon={DollarSign}
          color="violet"
          value={`$${estimatedSaved.toFixed(0)}`}
          label="Saved vs scroll"
        />
      </div>

      {/* ── Weekly Challenge ────────────────────────────────────── */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                Weekly Challenge
              </span>
              <h3 className="font-extrabold text-zinc-100 text-sm leading-tight">
                {CURRENT_CHALLENGE.title}
              </h3>
            </div>
          </div>
          <span className="text-[10px] text-zinc-500 shrink-0">
            Resets in {formatTimeUntilReset()}
          </span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          {CURRENT_CHALLENGE.description}
        </p>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold">
            <span className={challengeMet ? "text-emerald-400" : "text-zinc-400"}>
              {challengeMet ? "Challenge complete!" : "Progress"}
            </span>
            <span className={challengeMet ? "text-emerald-400" : "text-zinc-300"}>
              {thisWeekCount} / {CURRENT_CHALLENGE.goal}
            </span>
          </div>
          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${challengeProgress * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          Reward: <span className="text-emerald-300 font-bold">{CURRENT_CHALLENGE.rewardLabel}</span>
        </div>
      </div>

      {/* ── Shareable Streak Card ───────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400 px-1">
          Share your progress
        </h2>

        {/* Preview card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-teal-900 to-zinc-950 border border-emerald-500/30 p-6 shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <span className="text-emerald-300 font-black text-sm">F</span>
              </div>
              <span className="font-extrabold tracking-tight text-white">FinScroll</span>
            </div>
            <div>
              <div className="text-5xl font-black tracking-tighter text-white leading-none">
                Day {Math.max(streak, 1)}
              </div>
              <p className="text-sm text-emerald-100 mt-2 leading-relaxed whitespace-pre-line">
                {shareText.split("\n")[0]}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
              <div>
                <div className="text-[9px] text-emerald-200/70 uppercase font-black tracking-wider">Mastered</div>
                <div className="text-2xl font-black text-white">{completedCount}</div>
              </div>
              <div>
                <div className="text-[9px] text-emerald-200/70 uppercase font-black tracking-wider">Saved</div>
                <div className="text-2xl font-black text-white">${estimatedSaved.toFixed(0)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Share / Copy buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition-colors"
          >
            {shareStatus === "shared" ? (
              <><Check className="w-4 h-4" /> Shared</>
            ) : (
              <><Share2 className="w-4 h-4" /> Share</>
            )}
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-bold text-sm transition-colors"
          >
            {shareStatus === "copied" ? (
              <><Check className="w-4 h-4 text-emerald-400" /> Copied</>
            ) : (
              <><Copy className="w-4 h-4" /> Copy</>
            )}
          </button>
        </div>

        {shareStatus === "error" && (
          <p className="text-[11px] text-rose-400 text-center">
            Couldn&apos;t share — try copying instead.
          </p>
        )}

        <p className="text-center text-[10px] text-zinc-600 leading-relaxed pt-1">
          <BarChart3 className="inline w-3 h-3 mr-1" />
          Share to TikTok, Instagram, or your group chat.<br />
          The more people who break the doomscroll loop, the better.
        </p>
      </div>

    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  color: "emerald" | "sky" | "violet";
  value: string;
  label: string;
}

function StatCard({ icon: Icon, color, value, label }: StatCardProps) {
  const colorMap = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    sky: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  } as const;

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3 space-y-2">
      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${colorMap[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="text-lg font-black text-zinc-100 tracking-tight">{value}</div>
        <div className="text-[9px] text-zinc-500 leading-tight">{label}</div>
      </div>
    </div>
  );
}
