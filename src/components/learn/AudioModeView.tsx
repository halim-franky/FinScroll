"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipForward, SkipBack } from "lucide-react";
import type { Card } from "@/lib/learn/types";
import { speak, stopSpeech } from "@/lib/learn/audio";

interface Props {
  cards: readonly Card[];
}

/**
 * Audio Mode plays the entire feed as a continuous podcast. Each card
 * is narrated end-to-end (title + key fact + impact). Auto-advances to
 * the next card when current one finishes.
 *
 * For commute / multitasking scenarios where reading on a phone doesn't fit.
 */
export function AudioModeView({ cards }: Props) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const indexRef = useRef(index);
  indexRef.current = index;

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

  useEffect(() => {
    return () => stopSpeech();
  }, []);

  return (
    <div className="h-full bg-zinc-950 flex flex-col">
      <div className={`flex-1 relative overflow-hidden`}>
        <div className={`absolute inset-0 bg-gradient-to-b ${card.gradient}`} />
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
          <div className="text-7xl mb-6">{card.emoji}</div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">
            Track {index + 1} of {cards.length} · {card.level}
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight mb-2">
            {card.title}
          </h2>
          <p className="text-sm text-zinc-300 italic max-w-sm">&ldquo;{card.hook}&rdquo;</p>
        </div>
      </div>

      {/* Playback controls */}
      <div className="px-6 py-6 border-t border-zinc-900 bg-zinc-950">
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
        <p className="text-center text-[10px] text-zinc-600 mt-4 font-bold uppercase tracking-widest">
          Audio Mode · Continuous Playback
        </p>
      </div>
    </div>
  );
}
