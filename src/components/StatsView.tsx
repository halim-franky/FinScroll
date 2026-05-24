"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import {
  Flame, Trophy, Clock, DollarSign, Share2, Copy, Check, Loader2, Download, X,
  Target, Sparkles, BarChart3,
} from "lucide-react";
import {
  CURRENT_CHALLENGE, countThisWeek, formatTimeUntilReset,
} from "@/lib/weeklyChallenge";
import { KnowledgeTree } from "./learn/KnowledgeTree";
import { MyNotes } from "./learn/MyNotes";

// Learn v3 storage key — falls back to v2 if v3 isn't populated yet
const STORAGE_KEY_V3 = (uid: string) => `finscroll_v3_${uid}`;
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
  const [shareStatus, setShareStatus] = useState<
    "idle" | "rendering" | "shared" | "saved" | "copied" | "error"
  >("idle");
  const [origin, setOrigin] = useState("");
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const rawV3 = localStorage.getItem(STORAGE_KEY_V3(userId));
      const rawV2 = localStorage.getItem(STORAGE_KEY(userId));
      const raw = rawV3 ?? rawV2;
      if (raw) setFeedState(JSON.parse(raw));
      const s = localStorage.getItem("fs_streak");
      if (s) setStreak(parseInt(s, 10));
      setOrigin(window.location.origin);
    } catch {}
  }, [userId]);

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

  const estimatedMinutes = completedCount * 3 + streak * 5;
  const estimatedSaved = (estimatedMinutes / 60) * HOURLY_VALUE;

  // Used for two purposes:
  //   • Drawn into the image card (first line only) as the description under
  //     the "Day X" hero number — so we deliberately don't repeat "Day X" here.
  //   • Sent verbatim by the Copy Text button to clipboard.
  const shareText = `Replacing TikTok finance hype with real SEC-grounded financial literacy on FinScroll 🔥📈

Day ${streak || 1} · ${completedCount} concepts mastered. Building wealth instead of doomscrolling.`;

  /**
   * Render the green progress card as a PNG and hand it to the OS share sheet
   * (mobile) or download it (desktop). Visual-first sharing wins on every
   * social platform vs. plain text — Instagram Stories / TikTok / Twitter
   * all auto-preview an image and zero of them auto-preview a text snippet.
   */
  const handleShareImage = async () => {
    if (typeof window === "undefined" || !cardRef.current) return;
    setShareStatus("rendering");
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#0a0a0a",
        cacheBust: true,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const filename = `finscroll-streak-day-${streak || 1}.png`;
      const file = new File([blob], filename, { type: "image/png" });

      const canShareFile =
        "canShare" in navigator &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] });

      if (canShareFile) {
        // No `text` field — the image already contains the streak summary
        // visually, so passing the same string as text would render twice
        // (once inside the PNG, again as the message body). Leaving just
        // the image makes the share clean and Instagram-Story-ready.
        await navigator.share({
          title: "My FinScroll streak",
          files: [file],
        });
        setShareStatus("shared");
      } else {
        // Desktop / unsupported browser: download so the user can drag it
        // into a post manually.
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShareStatus("saved");
      }
    } catch (err) {
      const cancelled = err instanceof Error && err.name === "AbortError";
      if (cancelled) {
        setShareStatus("idle");
      } else {
        try {
          await navigator.clipboard.writeText(`${shareText}\n\n${origin}`);
          setShareStatus("copied");
        } catch {
          setShareStatus("error");
        }
      }
    }
    setTimeout(() => setShareStatus("idle"), 2600);
  };

  /**
   * Plain-text clipboard copy. Faster path for users who want to paste into
   * Discord / iMessage / etc. as a quick line, without the image overhead.
   */
  const handleCopyText = async () => {
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
          <span className="text-[10px] text-zinc-300 shrink-0">
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

        <div className="flex items-center gap-1.5 text-[10px] text-zinc-300">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          Reward: <span className="text-emerald-300 font-bold">{CURRENT_CHALLENGE.rewardLabel}</span>
        </div>
      </div>

      {/* ── Shareable Streak Card ───────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400 px-1">
          Share your progress
        </h2>

        {/* Preview card — ref-attached so we can rasterize it to PNG.
            Colors are inline hex because Tailwind v4 `oklch()` doesn't
            always survive the html-to-image canvas round-trip. */}
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-2xl p-6 shadow-2xl border"
          style={{
            background:
              "linear-gradient(135deg, #047857 0%, #134e4a 55%, #0a0a0a 100%)",
            borderColor: "rgba(16, 185, 129, 0.3)",
            color: "#ffffff",
          }}
        >
          <div className="relative space-y-4">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.2)",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                }}
              >
                <span
                  className="font-black text-sm"
                  style={{ color: "#6ee7b7" }}
                >
                  F
                </span>
              </div>
              <span
                className="font-extrabold tracking-tight"
                style={{ color: "#ffffff" }}
              >
                FinScroll
              </span>
            </div>
            <div>
              <div
                className="text-5xl font-black tracking-tighter leading-none"
                style={{ color: "#ffffff" }}
              >
                Day {Math.max(streak, 1)}
              </div>
              <p
                className="text-sm mt-2 leading-relaxed whitespace-pre-line"
                style={{ color: "#d1fae5" }}
              >
                {shareText.split("\n")[0]}
              </p>
            </div>
            <div
              className="grid grid-cols-2 gap-3 pt-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
            >
              <div>
                <div
                  className="text-[9px] uppercase font-black tracking-wider"
                  style={{ color: "rgba(167, 243, 208, 0.8)" }}
                >
                  Mastered
                </div>
                <div
                  className="text-2xl font-black"
                  style={{ color: "#ffffff" }}
                >
                  {completedCount}
                </div>
              </div>
              <div>
                <div
                  className="text-[9px] uppercase font-black tracking-wider"
                  style={{ color: "rgba(167, 243, 208, 0.8)" }}
                >
                  Saved
                </div>
                <div
                  className="text-2xl font-black"
                  style={{ color: "#ffffff" }}
                >
                  ${estimatedSaved.toFixed(0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Share image (primary) / Copy text (secondary).
            Differentiated by *medium*, not just by source: Share renders the
            card as a PNG and hands it to the OS share sheet so Instagram,
            TikTok, Twitter all auto-preview the visual; Copy text is the
            fast-paste fallback for chat apps. */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleShareImage}
            disabled={shareStatus === "rendering"}
            className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/70 text-zinc-950 font-bold text-sm transition-colors"
          >
            {shareStatus === "rendering" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Rendering
              </>
            ) : shareStatus === "shared" ? (
              <>
                <Check className="w-4 h-4" /> Shared
              </>
            ) : shareStatus === "saved" ? (
              <>
                <Download className="w-4 h-4" /> Saved
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" /> Share image
              </>
            )}
          </button>
          <button
            onClick={handleCopyText}
            className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-bold text-sm transition-colors"
          >
            {shareStatus === "copied" ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy text
              </>
            )}
          </button>
        </div>

        {shareStatus === "error" && (
          <p className="text-[11px] text-rose-400 text-center flex items-center justify-center gap-1">
            <X className="w-3 h-3" />
            Couldn&apos;t share, try copying instead.
          </p>
        )}

        <p className="text-center text-[10px] text-zinc-400 leading-relaxed pt-1">
          <BarChart3 className="inline w-3 h-3 mr-1" />
          Share to TikTok, Instagram, or your group chat.<br />
          The more people who break the doomscroll loop, the better.
        </p>
      </div>

      {/* ── Knowledge Tree ─────────────────────────────────── */}
      <KnowledgeTree
        completedIds={Object.entries(feedState.completed ?? {})
          .filter(([, v]) => v)
          .map(([k]) => k)}
      />

      {/* ── My Notes ───────────────────────────────────────── */}
      <MyNotes userId={userId} />

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
        <div className="text-[9px] text-zinc-300 leading-tight">{label}</div>
      </div>
    </div>
  );
}
