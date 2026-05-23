"use client";

import { useRef, useState } from "react";
import type { Card } from "@/lib/learn/types";
import { Sparkles, Play, ExternalLink, Maximize2 } from "lucide-react";

interface Props {
  card: Card;
  isActive: boolean;
}

/**
 * Hook frame — theatre presentation.
 *
 * Layout strategy:
 *   1. The card background is a soft radial spotlight (zinc + emerald tint)
 *      to feel like a darkened cinema.
 *   2. The video sits **centered** in a rounded, glowing 16:9 frame.
 *      All of YouTube's own UI (title overlay, channel name, progress bar,
 *      share/time, YouTube watermark) stays INSIDE this rounded frame —
 *      they cannot leak into our area because the frame is solid black.
 *   3. Our app's UI lives in the empty space ABOVE and BELOW the video:
 *        • Topic chip + fullscreen button float above the player
 *        • "Tap right for context" call-to-action floats below
 *      Neither ever sits on top of the iframe.
 *
 * YouTube ToS compliance: official iframe embed; we do not CSS-hide
 * any YouTube branding — the player still shows its logo, channel name,
 * and progress bar inside the rounded card the way YouTube renders them.
 */
export function HookFrame({ card, isActive }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const embedUrl = card.videoEmbedUrl
    ? `${card.videoEmbedUrl}${card.videoEmbedUrl.includes("?") ? "&" : "?"}rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&fs=1&autoplay=${isActive ? 1 : 0}&mute=1`
    : null;

  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${card.title} ${card.topic} explained under 5 minutes`,
  )}`;

  const handleFullscreen = () => {
    const el = iframeRef.current;
    if (!el) return;
    const req =
      el.requestFullscreen ??
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (el as any).webkitRequestFullscreen ??
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (el as any).webkitEnterFullscreen;
    if (req) {
      req.call(el).then(() => setIsFullscreen(true)).catch(() => {});
    }
  };

  if (embedUrl) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-zinc-950">
        {/* Cinema-style spotlight backdrop — subtle, soft, behind everything */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(16,185,129,0.10),transparent_70%)]" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/40 via-transparent to-black/40" />

        {/* Three-band flex layout: top hint, video, bottom hint.
            pt-24 pb-16 clears the HUD and the chevron bar respectively. */}
        <div className="relative h-full flex flex-col pt-24 pb-16 px-4">
          {/* Top band — topic chip + fullscreen */}
          <div className="flex items-center justify-between gap-3 py-3 shrink-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
              <Sparkles className="w-3 h-3" />
              {card.topic}
            </span>
            <button
              onClick={handleFullscreen}
              aria-label="Watch fullscreen"
              className="p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-100 transition-colors backdrop-blur-sm"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Video — centered in the remaining space, 16:9, framed and glowing */}
          <div className="flex-1 flex items-center justify-center min-h-0">
            <div className="relative w-full max-w-md">
              {/* Glow halo */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-emerald-500/30 via-emerald-400/10 to-transparent blur-xl pointer-events-none" />
              {/* Player frame */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-zinc-700/60 bg-black shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]">
                <iframe
                  ref={iframeRef}
                  src={embedUrl}
                  title={card.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>
          </div>

          {/* Bottom band — pulsing tap hint */}
          <div className="shrink-0 py-3 flex items-center justify-center">
            <p className="inline-flex items-center gap-1.5 text-[11px] text-zinc-200 font-bold uppercase tracking-widest animate-[pulse_2.4s_ease-in-out_infinite]">
              Tap right to continue this topic
              <span aria-hidden>→</span>
            </p>
          </div>
        </div>

        {/* SR-only fullscreen state */}
        <span className="sr-only" aria-live="polite">
          {isFullscreen ? "Video in fullscreen mode" : ""}
        </span>
      </div>
    );
  }

  // ── Fallback (no video set) ─────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center h-full px-5 pt-24 pb-16 text-center">
      <div className="flex flex-col items-center gap-4 max-w-sm w-full">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-widest">
          <Sparkles className="w-3 h-3" />
          {card.topic}
        </span>
        <div className="text-7xl">{card.emoji}</div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
          {card.title}
        </h2>
        <p className="text-sm sm:text-base text-zinc-200 font-medium italic">
          &ldquo;{card.hook}&rdquo;
        </p>
        <a
          href={youtubeSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold transition-colors"
        >
          <Play className="w-3 h-3 fill-white" />
          Find a related video
          <ExternalLink className="w-3 h-3" />
        </a>
        <p className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest mt-2">
          Tap right to continue →
        </p>
      </div>
    </div>
  );
}
