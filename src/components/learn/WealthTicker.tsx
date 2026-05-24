"use client";

import { useEffect, useRef, useState } from "react";
import { Leaf } from "lucide-react";
import { computeImpact, formatTickerCurrency } from "@/lib/learn/impact";
import { readOnboarding } from "@/components/OnboardingModal";

interface Props {
  /** True while the Hook frame is active and attention is "on this video". */
  active: boolean;
  userId: string;
}

/**
 * Live ticker: every second this is active, accrue compound future-value
 * dollars based on the user's redirected scroll-cost rate. Visualizes the
 * core FinScroll proposition — that this moment of attention isn't free,
 * it's worth something to your future self.
 *
 * The math is in @/lib/learn/impact. The number shown is in 30-year
 * future dollars, not nominal. We label it that way so it's honest.
 */
export function WealthTicker({ active, userId }: Props) {
  const [recovered, setRecovered] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const rateRef = useRef(0);

  // Compute the user's per-second rate once on mount
  useEffect(() => {
    const onboarding = readOnboarding(userId);
    const impact = computeImpact(onboarding);
    rateRef.current = impact.perSecondRate;
  }, [userId]);

  // Tick the counter only while active
  useEffect(() => {
    if (!active) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTickRef.current = 0;
      return;
    }

    const tick = (now: number) => {
      if (lastTickRef.current === 0) {
        lastTickRef.current = now;
      } else {
        const deltaSec = (now - lastTickRef.current) / 1000;
        lastTickRef.current = now;
        setRecovered((r) => r + deltaSec * rateRef.current);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      lastTickRef.current = 0;
    };
  }, [active]);

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-[10px] font-bold tabular-nums backdrop-blur-sm">
      <Leaf className="w-3 h-3 text-emerald-400" />
      <span className="text-emerald-300">{formatTickerCurrency(recovered)}</span>
      <span className="text-emerald-100/70 normal-case font-medium">
        recovered
      </span>
    </div>
  );
}
