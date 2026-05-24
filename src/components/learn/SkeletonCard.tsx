"use client";

import { Sparkles } from "lucide-react";

/**
 * SkeletonCard
 *
 * Renders while the next RAG-generated card is being fetched (~2–5 s on a
 * cold cache, instant on a warm cache hit). Lives at the end of the
 * scrollable feed as a real snap-start slot so the scroll position stays
 * predictable when the actual card arrives and slots into the same
 * position.
 *
 * Visual cues:
 *   • A subtle pulsing emerald dot signals "more on the way"
 *   • Layout matches a Story card so the transition into the real card
 *     doesn't shift other UI around
 *   • Quiet messaging — we don't promise instant infinity, we just say
 *     "writing your next card" so users understand the brief wait
 */
export function SkeletonCard() {
  return (
    <div
      className="relative w-full h-full snap-start shrink-0 overflow-hidden bg-zinc-950"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Soft emerald spotlight to match Story-card cinema vibe */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_45%,rgba(16,185,129,0.10),transparent_70%)]" />

      <div className="relative h-full flex flex-col items-center justify-center px-8 text-center gap-5">
        {/* Pulsing brand chip */}
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-emerald-500/30 blur-2xl animate-pulse" />
          <div className="relative w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-emerald-300" />
          </div>
        </div>

        <div className="space-y-2 max-w-xs">
          <h3 className="text-base font-extrabold tracking-tight text-white">
            Writing your next concept…
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Pulling fresh research from SEC publications and peer-reviewed
            sources. Usually ~3 seconds.
          </p>
        </div>

        {/* Three-bar shimmer to suggest a card forming */}
        <div className="w-full max-w-xs space-y-2 pt-2">
          <ShimmerBar widthClass="w-3/4" />
          <ShimmerBar widthClass="w-full" />
          <ShimmerBar widthClass="w-2/3" />
        </div>
      </div>
    </div>
  );
}

function ShimmerBar({ widthClass }: { widthClass: string }) {
  return (
    <div
      className={`h-2 rounded-full bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%] animate-[shimmer_1.6s_ease-in-out_infinite] ${widthClass}`}
    />
  );
}
