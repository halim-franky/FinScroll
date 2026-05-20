"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X, TrendingUp } from "lucide-react";

// Session-time milestones (in minutes) at which a nudge banner fires.
// Each milestone fires exactly once per page-load session.
const MILESTONES = [1, 5, 15, 30, 60] as const;
type Milestone = typeof MILESTONES[number];

// Assumed opportunity-cost rate: $3/hr of impulse spending averted by
// time spent learning instead of doomscrolling. Conservative default
// that mirrors the Wealth Calculator's baseline.
const HOURLY_VALUE = 3;
// Long-horizon compound rate used for the "in 30 years" projection.
const COMPOUND_RATE_30YR = Math.pow(1.08, 30); // ≈ 10.06

interface MilestoneCopy {
  headline: string;
  body: string;
}

function copyFor(m: Milestone, savedToday: number, projected: number): MilestoneCopy {
  const $ = (n: number) =>
    n < 10 ? `$${n.toFixed(2)}` : `$${Math.round(n).toLocaleString()}`;

  switch (m) {
    case 1:
      return {
        headline: "Welcome back",
        body: "One minute in. Your first scroll has actual value.",
      };
    case 5:
      return {
        headline: "5 minutes strong",
        body: `${$(savedToday)} saved today vs. doomscrolling impulse buys.`,
      };
    case 15:
      return {
        headline: "15 minutes learning",
        body: `${$(savedToday)} saved → ${$(projected)} projected in 30 years.`,
      };
    case 30:
      return {
        headline: "Half an hour deep",
        body: `${$(savedToday)} saved today + brain leveled up. ${$(projected)} future value.`,
      };
    case 60:
      return {
        headline: "One whole hour",
        body: `${$(savedToday)} saved + you just rewired your scroll habit. ${$(projected)} in 30 years.`,
      };
  }
}

interface ActiveToast {
  milestone: Milestone;
  copy: MilestoneCopy;
}

interface Props {
  // Currently unused but kept for parity with other (app) layout
  // components — would let us key per-user persistence later.
  userId?: string;
}

export function SessionNudge({ }: Props) {
  const [seconds, setSeconds] = useState(0);
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const triggered = useRef<Set<Milestone>>(new Set());
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tick every second
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Watch for milestone crossings
  useEffect(() => {
    const minutes = Math.floor(seconds / 60);
    for (const m of MILESTONES) {
      if (minutes >= m && !triggered.current.has(m)) {
        triggered.current.add(m);
        const savedToday = (minutes / 60) * HOURLY_VALUE;
        const projected = savedToday * COMPOUND_RATE_30YR;
        setToast({
          milestone: m,
          copy: copyFor(m, savedToday, projected),
        });
        // Auto-dismiss after 7 seconds
        if (dismissTimer.current) clearTimeout(dismissTimer.current);
        dismissTimer.current = setTimeout(() => setToast(null), 7000);
        break; // only one milestone per tick
      }
    }
  }, [seconds]);

  useEffect(() => {
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  if (!toast) return null;

  const handleDismiss = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setToast(null);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-40 px-4 sm:px-0 animate-fadeIn"
    >
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-[0_10px_40px_rgba(16,185,129,0.2)] p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-extrabold text-zinc-50 leading-tight">
              {toast.copy.headline}
            </p>
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
              <TrendingUp className="inline w-2.5 h-2.5 -mt-0.5 mr-0.5" />
              {toast.milestone} min
            </span>
          </div>
          <p className="text-xs text-zinc-300 leading-snug">{toast.copy.body}</p>
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
