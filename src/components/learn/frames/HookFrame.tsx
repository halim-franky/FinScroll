"use client";

import { useEffect, useRef, useState } from "react";
import type { Card } from "@/lib/learn/types";
import { Sparkles, Play, ExternalLink, Maximize2 } from "lucide-react";
import { WealthTicker } from "../WealthTicker";

interface Props {
  card: Card;
  isActive: boolean;
  userId: string;
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
export function HookFrame({ card, isActive, userId }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Fullscreen targets the WRAPPER, not the iframe — most browsers refuse
  // to fullscreen a bare <iframe> (cross-origin restrictions on YouTube)
  // but happily fullscreen its container element, which carries the iframe
  // along with it via `position: absolute; inset: 0`.
  const playerWrapRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keep `isFullscreen` in sync with the actual fullscreen state so an
  // exit triggered by Esc / iOS swipe doesn't leave the UI stuck.
  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  // `fs=0` hides YouTube's built-in fullscreen control so we don't have two
  // fullscreen buttons fighting for the same job — ours (top-right of the
  // card) is the single, discoverable entry point. Channel name, watermark,
  // and CC remain visible per YouTube ToS.
  const embedUrl = card.videoEmbedUrl
    ? `${card.videoEmbedUrl}${card.videoEmbedUrl.includes("?") ? "&" : "?"}rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&fs=0&autoplay=${isActive ? 1 : 0}&mute=1`
    : null;

  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${card.title} ${card.topic} explained under 5 minutes`,
  )}`;

  const handleFullscreen = async () => {
    // Already in fullscreen? Exit instead.
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {}
      return;
    }

    // Prefer fullscreening the wrapper div — works across Chrome / Firefox
    // / Edge / Safari desktop. The iframe inside fills it via inset: 0.
    const wrap = playerWrapRef.current;
    if (wrap?.requestFullscreen) {
      try {
        await wrap.requestFullscreen();
        return;
      } catch {}
    }

    // iOS Safari fallback: cross-origin iframes can't be programmatically
    // fullscreened, and we can't reach the <video> element inside YouTube's
    // iframe. Open the YouTube watch page in a new tab where the native
    // player handles fullscreen on its own.
    const idMatch = card.videoEmbedUrl?.match(/\/embed\/([^/?]+)/);
    if (idMatch) {
      window.open(
        `https://www.youtube.com/watch?v=${idMatch[1]}`,
        "_blank",
        "noopener,noreferrer",
      );
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
          {/* Top band — topic chip, wealth ticker, fullscreen button.
              `min-w-0` on the inner flex container is required so children
              can shrink below their intrinsic content width on narrow
              viewports. Each chip carries `max-w-[X]` + `truncate` so its
              text gets an ellipsis rather than pushing the row past the
              screen edge. Fullscreen button stays `shrink-0` so it's
              always visible. */}
          <div className="flex items-center justify-between gap-2 py-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* Auto-generated "Today's Drop" badge replaces the topic chip
                  on RAG-generated cards (id prefix `daily-`). Compact —
                  the actual topic appears in the card title below, no need
                  to duplicate it in the chip. */}
              {String(card.id).startsWith("daily-") ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/50 text-amber-200 text-[10px] font-black uppercase tracking-widest backdrop-blur-sm shrink-0">
                  <Sparkles className="w-3 h-3" />
                  Today&apos;s Drop
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-widest backdrop-blur-sm min-w-0 max-w-[60%]">
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span className="truncate">{card.topic}</span>
                </span>
              )}
              <WealthTicker active={isActive} userId={userId} />
            </div>
            <button
              onClick={handleFullscreen}
              aria-label="Watch fullscreen"
              className="shrink-0 p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-100 transition-colors backdrop-blur-sm"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Video — centered in the remaining space, 16:9, framed and glowing */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-0 gap-2">
            <div className="relative w-full max-w-md">
              {/* Glow halo */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-emerald-500/30 via-emerald-400/10 to-transparent blur-xl pointer-events-none" />
              {/* Player frame — ref'd so the fullscreen button targets the
                  wrapper (which most browsers support) instead of the
                  iframe (which they often refuse to fullscreen). */}
              <div
                ref={playerWrapRef}
                className="relative w-full aspect-video rounded-2xl overflow-hidden border border-zinc-700/60 bg-black shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]"
              >
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
            {/* Creator credit — clear attribution per YouTube ToS, signals we
                curate from real educators rather than scraping at random. */}
            {card.videoCreator && (
              <p className="text-[10px] text-zinc-400 leading-snug max-w-md w-full text-center px-2">
                Curated by FinScroll · sourced from{" "}
                <span className="text-zinc-200 font-semibold">{card.videoCreator}</span>{" "}
                on YouTube
              </p>
            )}
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
