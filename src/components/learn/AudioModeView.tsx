"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipForward, SkipBack, Headphones } from "lucide-react";
import type { Card } from "@/lib/learn/types";
import { speak, stopSpeech } from "@/lib/learn/audio";

interface Props {
  cards: readonly Card[];
}

/**
 * Audio Mode plays the entire feed as a continuous podcast. The screen
 * has three regions: a compact now-playing header, a scrollable track
 * list, and fixed playback controls. Tapping a track jumps to it.
 */
export function AudioModeView({ cards }: Props) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const indexRef = useRef(index);
  indexRef.current = index;
  const listRef = useRef<HTMLDivElement | null>(null);

  const card = cards[index];

  const playCurrent = (i: number) => {
    if (i >= cards.length) {
      setIsPlaying(false);
      return;
    }
    const c = cards[i];
    const text = `${c.title}. ${c.hook}. ${c.keyFact}. The impact: ${c.impactValue}.`;
    speak(text, {
      onEnd: () => {
        const nextIdx = indexRef.current + 1;
        if (nextIdx < cards.length) {
          setIndex(nextIdx);
          playCurrent(nextIdx);
        } else {
          setIsPlaying(false);
        }
      },
      onError: () => setIsPlaying(false),
    });
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      stopSpeech();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playCurrent(index);
    }
  };

  const handleNext = () => {
    stopSpeech();
    const next = Math.min(index + 1, cards.length - 1);
    setIndex(next);
    if (isPlaying) playCurrent(next);
  };

  const handlePrev = () => {
    stopSpeech();
    const prev = Math.max(index - 1, 0);
    setIndex(prev);
    if (isPlaying) playCurrent(prev);
  };

  const handleSelect = (i: number) => {
    stopSpeech();
    setIndex(i);
    if (isPlaying) playCurrent(i);
  };

  useEffect(() => {
    return () => stopSpeech();
  }, []);

  // Scroll the active track into view whenever it changes
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-track-index="${index}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [index]);

  return (
    <div className="h-full bg-zinc-950 flex flex-col">
      {/* Now Playing — compact header */}
      <div className="relative shrink-0 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-b ${card.gradient}`} />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 px-5 pt-14 pb-4 flex items-center gap-4">
          <div className="text-4xl shrink-0">{card.emoji}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <Headphones className="w-3 h-3 text-emerald-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                Now Playing · {index + 1}/{cards.length}
              </span>
            </div>
            <h2 className="text-base font-black text-white tracking-tight leading-tight truncate">
              {card.title}
            </h2>
            <p className="text-[11px] text-zinc-300 italic line-clamp-1 mt-0.5">
              &ldquo;{card.hook}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Track list — scrollable */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5"
      >
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 px-1 pb-1">
          Playlist · {cards.length} tracks
        </p>
        {cards.map((c, i) => {
          const active = i === index;
          return (
            <button
              key={c.id}
              data-track-index={i}
              onClick={() => handleSelect(i)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-colors ${
                active
                  ? "bg-emerald-500/10 border-emerald-500/40"
                  : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div className="text-2xl shrink-0">{c.emoji}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className={`text-[9px] font-black uppercase tracking-widest tabular-nums ${
                      active ? "text-emerald-400" : "text-zinc-400"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] text-zinc-400">·</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-300">
                    {c.level}
                  </span>
                </div>
                <p
                  className={`text-sm font-bold tracking-tight leading-snug truncate ${
                    active ? "text-white" : "text-zinc-200"
                  }`}
                >
                  {c.title}
                </p>
                <p className="text-[11px] text-zinc-400 italic line-clamp-1 mt-0.5">
                  {c.hook}
                </p>
              </div>
              {active && isPlaying && (
                <div className="shrink-0 flex items-end gap-0.5 h-4">
                  <span className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-2" />
                  <span className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-3.5 [animation-delay:120ms]" />
                  <span className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-2.5 [animation-delay:240ms]" />
                </div>
              )}
              {active && !isPlaying && (
                <Play className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Playback controls — fixed */}
      <div className="shrink-0 px-6 py-4 border-t border-zinc-900 bg-zinc-950">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handlePrev}
            disabled={index === 0}
            aria-label="Previous track"
            className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-colors disabled:opacity-30"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={handlePlayPause}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="p-5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors shadow-[0_0_25px_rgba(16,185,129,0.4)]"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          <button
            onClick={handleNext}
            disabled={index >= cards.length - 1}
            aria-label="Next track"
            className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-colors disabled:opacity-30"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
