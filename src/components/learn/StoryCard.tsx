"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import type { Card } from "@/lib/learn/types";
import { HookFrame } from "./frames/HookFrame";
import { VisualFrame } from "./frames/VisualFrame";
import { InsightFrame } from "./frames/InsightFrame";
import { QuizFrame } from "./frames/QuizFrame";
import { ActionFrame } from "./frames/ActionFrame";
import { speak, stopSpeech } from "@/lib/learn/audio";

interface Props {
  card: Card;
  userId: string;
  isActive: boolean;                         // is this the card currently in view?
  audioEnabled: boolean;
  quizAnswer: number | null;
  onAnswer: (cardId: string | number, idx: number) => void;
  onJumpToCard: (cardId: string | number) => void;
}

const FRAME_NAMES = ["Hook", "Visual", "Insight", "Quiz", "Action"] as const;

export function StoryCard({
  card,
  userId,
  isActive,
  audioEnabled,
  quizAnswer,
  onAnswer,
  onJumpToCard,
}: Props) {
  const [frame, setFrame] = useState(0);
  const startX = useRef<number | null>(null);

  const next = useCallback(() => {
    setFrame((f) => Math.min(f + 1, 4));
  }, []);

  const prev = useCallback(() => {
    setFrame((f) => Math.max(f - 1, 0));
  }, []);

  // Reset to frame 0 whenever this card becomes active
  useEffect(() => {
    if (isActive) setFrame(0);
  }, [isActive, card.id]);

  // Audio narration — speaks the relevant text whenever frame changes
  useEffect(() => {
    if (!isActive || !audioEnabled) return;
    let textForFrame = "";
    if (frame === 0) textForFrame = `${card.title}. ${card.hook}`;
    else if (frame === 1) textForFrame = `${card.impactLabel}: ${card.impactValue}.`;
    else if (frame === 2) textForFrame = card.insight;
    else if (frame === 3) textForFrame = card.quiz.question;
    else textForFrame = "";

    if (textForFrame) {
      const stop = speak(textForFrame, { rate: 1.05 });
      return () => stop();
    }
  }, [isActive, audioEnabled, frame, card]);

  // Stop any speech when leaving this card
  useEffect(() => {
    return () => stopSpeech();
  }, []);

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) next();
      else prev();
    }
    startX.current = null;
  };

  const handleAnswer = (idx: number) => {
    onAnswer(card.id, idx);
  };

  return (
    <div
      className={`relative w-full snap-start shrink-0 overflow-hidden`}
      style={{ height: "100dvh" }}
    >
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-b ${card.gradient}`} />
      <div className="absolute inset-0 bg-black/40" />

      {/* Top: progress bar + level badge */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-safe pt-3 pb-2 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-1">
          {FRAME_NAMES.map((_, i) => (
            <div
              key={i}
              className={`h-0.5 flex-1 rounded-full transition-colors duration-500 ${
                i < frame
                  ? "bg-emerald-400"
                  : i === frame
                  ? "bg-white"
                  : "bg-white/15"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Frame content */}
      <div
        className="relative z-10 h-full pt-12 pb-20"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {frame === 0 && <HookFrame card={card} isActive={isActive} />}
        {frame === 1 && <VisualFrame card={card} isActive={isActive} />}
        {frame === 2 && <InsightFrame card={card} userId={userId} isActive={isActive} />}
        {frame === 3 && (
          <QuizFrame card={card} answer={quizAnswer} onAnswer={handleAnswer} />
        )}
        {frame === 4 && (
          <ActionFrame card={card} userId={userId} onJumpToCard={onJumpToCard} />
        )}
      </div>

      {/* Frame navigation overlay — tap left/right to advance */}
      {/* Left half: previous */}
      {frame > 0 && (
        <button
          aria-label="Previous frame"
          onClick={prev}
          className="absolute left-0 top-16 bottom-20 w-1/4 z-20"
        />
      )}
      {/* Right half: next */}
      {frame < 4 && (
        <button
          aria-label="Next frame"
          onClick={next}
          className="absolute right-0 top-16 bottom-20 w-1/4 z-20"
        />
      )}

      {/* Bottom controls — manual chevrons for explicit feedback */}
      <div className="absolute bottom-2 left-0 right-0 z-30 flex items-center justify-between px-4">
        <button
          onClick={prev}
          disabled={frame === 0}
          aria-label="Previous frame"
          className={`p-2 rounded-full bg-black/40 backdrop-blur-sm border border-zinc-700/50 transition-opacity ${
            frame === 0 ? "opacity-30 cursor-not-allowed" : "text-zinc-300 hover:text-white"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">
            {FRAME_NAMES[frame]}
          </span>
          <span className="text-[9px] text-zinc-500">·</span>
          <span className="text-[10px] text-zinc-400 font-mono font-bold">
            {frame + 1}/5
          </span>
          {audioEnabled && (
            <>
              <span className="text-[9px] text-zinc-500">·</span>
              <span className="flex items-center gap-0.5 text-[9px] text-emerald-400 font-bold">
                <Volume2 className="w-2.5 h-2.5" /> Reading
              </span>
            </>
          )}
        </div>
        <button
          onClick={next}
          disabled={frame === 4}
          aria-label="Next frame"
          className={`p-2 rounded-full bg-black/40 backdrop-blur-sm border border-zinc-700/50 transition-opacity ${
            frame === 4 ? "opacity-30 cursor-not-allowed" : "text-zinc-300 hover:text-white"
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
