"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Volume2, Lock } from "lucide-react";
import type { Card } from "@/lib/learn/types";
import { HookFrame } from "./frames/HookFrame";
import { VisualFrame } from "./frames/VisualFrame";
import { InsightFrame } from "./frames/InsightFrame";
import { QuizFrame } from "./frames/QuizFrame";
import { ActionFrame } from "./frames/ActionFrame";
import { speak, stopSpeech } from "@/lib/learn/audio";
import { slideX } from "@/lib/motion";

interface Props {
  card: Card;
  userId: string;
  isActive: boolean;                         // is this the card currently in view?
  audioEnabled: boolean;
  quizAnswer: number | null;
  onAnswer: (cardId: string | number, idx: number) => void;
  onJumpToCard: (cardId: string | number) => void;
  /** Notify parent of current frame so it can render a sticky progress bar. */
  onFrameChange?: (frame: number) => void;
}

const FRAME_NAMES = ["Video", "Visual", "Insight", "Quiz", "Proof"] as const;

function StoryCardImpl({
  card,
  userId,
  isActive,
  audioEnabled,
  quizAnswer,
  onAnswer,
  onJumpToCard,
  onFrameChange,
}: Props) {
  const [frame, setFrame] = useState(0);
  const [direction, setDirection] = useState(1);  // 1 = forward, -1 = back
  const startX = useRef<number | null>(null);

  // Quiz gate: the user must answer the quiz correctly before reaching
  // the Proof frame. We surface a transient message when they try to
  // advance without satisfying the gate so they understand *why* nothing
  // happened — silent failure would feel like the button is broken.
  const [gateMessage, setGateMessage] = useState<string | null>(null);
  const quizPassed = quizAnswer !== null && quizAnswer === card.quiz.correctIndex;
  const isRightGated = frame === 3 && !quizPassed;

  const next = useCallback(() => {
    // Gate frame 3 → 4 on a correct quiz answer
    if (frame === 3 && (quizAnswer === null || quizAnswer !== card.quiz.correctIndex)) {
      setGateMessage(
        quizAnswer === null
          ? "Answer the quiz first to unlock your Proof."
          : "Not quite — pick the correct answer to unlock your Proof.",
      );
      return;
    }
    setDirection(1);
    setFrame((f) => Math.min(f + 1, 4));
  }, [frame, quizAnswer, card.quiz.correctIndex]);

  const prev = useCallback(() => {
    setDirection(-1);
    setFrame((f) => Math.max(f - 1, 0));
  }, []);

  // Auto-dismiss the gate message after a few seconds — long enough to
  // read, short enough not to linger if the user immediately fixes their
  // answer.
  useEffect(() => {
    if (!gateMessage) return;
    const id = setTimeout(() => setGateMessage(null), 2800);
    return () => clearTimeout(id);
  }, [gateMessage]);

  // Clear the message immediately when the user changes their quiz
  // answer to the correct one — feels responsive.
  useEffect(() => {
    if (quizPassed) setGateMessage(null);
  }, [quizPassed]);

  // Reset to frame 0 whenever this card becomes active
  useEffect(() => {
    if (isActive) setFrame(0);
  }, [isActive, card.id]);

  // Bubble current frame up so the parent can render a sticky progress bar
  useEffect(() => {
    if (isActive) onFrameChange?.(frame);
  }, [isActive, frame, onFrameChange]);

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
      className="relative w-full h-full snap-start shrink-0 overflow-hidden"
    >
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-b ${card.gradient}`} />
      <div className="absolute inset-0 bg-black/40" />

      {/* Frame content — slides horizontally on next/prev.
          NOTE: padding lives on individual frames (or HookFrame uses
          edge-to-edge video). The HUD (top) and chevron bar (bottom) are
          opaque/z-elevated so they cover anything underneath them. */}
      <div
        className="relative z-10 h-full overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={frame}
            custom={direction}
            variants={slideX}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0"
          >
            {frame === 0 && <HookFrame card={card} isActive={isActive} userId={userId} />}
            {frame === 1 && (
              <div className="h-full pt-24 pb-16">
                <VisualFrame card={card} isActive={isActive} />
              </div>
            )}
            {frame === 2 && (
              <div className="h-full pt-24 pb-16">
                <InsightFrame card={card} userId={userId} isActive={isActive} />
              </div>
            )}
            {frame === 3 && (
              <div className="h-full pt-24 pb-16">
                <QuizFrame card={card} answer={quizAnswer} onAnswer={handleAnswer} />
              </div>
            )}
            {frame === 4 && (
              <div className="h-full pt-24 pb-16">
                <ActionFrame
                  card={card}
                  userId={userId}
                  quizAnswer={quizAnswer}
                  onJumpToCard={onJumpToCard}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/*
        Frame navigation overlay — invisible tap targets so the whole
        story can be advanced with a single thumb.

        Frames 1–3 (visual / insight / quiz): left + right edge strips
        spanning the full card height.

        Frame 0 (video): we MUST NOT cover the YouTube iframe — its built-in
        controls (CC, settings, replay, scrubber) live inside the player
        and an overlay on top would steal those taps. Instead, render two
        full-width horizontal strips, one above and one below the video,
        each split into left (prev) / right (next) halves. The middle band
        where the iframe sits stays untouched.

        Frame 4 (proof): no right-tap zone (already the last frame), only
        the left-edge prev strip.
      */}
      {frame > 0 && (
        <button
          aria-label="Previous frame"
          onClick={prev}
          className="absolute left-0 top-24 bottom-16 w-1/4 z-20"
        />
      )}
      {frame > 0 && frame < 4 && (
        <button
          aria-label="Next frame"
          onClick={next}
          className="absolute right-0 top-24 bottom-16 w-1/4 z-20"
        />
      )}

      {frame === 0 && (
        // Single bottom strip — covers the creator credit and the pulsing
        // "Tap right to continue" hint, which is the area the user actually
        // expects to tap. We deliberately do NOT add a top strip on frame 0
        // because the chip band there contains the Fullscreen button — an
        // overlay would steal that button's taps and the user gets stuck
        // on a non-fullscreen video. The YouTube iframe in the middle is
        // also free from any overlay so its native controls work. The
        // strip stops 64px above the card edge so the chevrons stay
        // clickable.
        <div className="absolute left-0 right-0 bottom-16 h-[22%] z-20 flex">
          <button
            aria-label="Previous frame"
            onClick={prev}
            className="flex-1"
          />
          <button
            aria-label="Next frame"
            onClick={next}
            className="flex-1"
          />
        </div>
      )}

      {/* Gate message — slides up from the chevron bar when the user
          tries to advance past the quiz without a correct answer. */}
      <AnimatePresence>
        {gateMessage && (
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-14 left-1/2 -translate-x-1/2 z-40 px-4 max-w-[90%]"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-amber-500/15 border border-amber-500/40 backdrop-blur-md shadow-[0_8px_24px_-8px_rgba(245,158,11,0.4)]">
              <Lock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="text-[12px] font-bold text-amber-100 leading-tight">
                {gateMessage}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
          <span className="text-[9px] text-zinc-400">·</span>
          <span className="text-[10px] text-zinc-400 font-mono font-bold">
            {frame + 1}/5
          </span>
          {audioEnabled && (
            <>
              <span className="text-[9px] text-zinc-400">·</span>
              <span className="flex items-center gap-0.5 text-[9px] text-emerald-400 font-bold">
                <Volume2 className="w-2.5 h-2.5" /> Reading
              </span>
            </>
          )}
        </div>
        <button
          onClick={next}
          disabled={frame === 4}
          aria-label={
            isRightGated
              ? "Locked — answer the quiz correctly to continue"
              : "Next frame"
          }
          className={`p-2 rounded-full backdrop-blur-sm border transition-opacity ${
            frame === 4
              ? "bg-black/40 border-zinc-700/50 opacity-30 cursor-not-allowed"
              : isRightGated
              ? "bg-amber-500/15 border-amber-500/40 text-amber-200"
              : "bg-black/40 border-zinc-700/50 text-zinc-300 hover:text-white"
          }`}
        >
          {isRightGated ? (
            <Lock className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

// Memoized so the parent's other state changes (active card index, etc.)
// don't trigger every card to re-render. We re-render only if the props
// affecting THIS card actually change.
export const StoryCard = memo(StoryCardImpl, (prev, next) =>
  prev.card.id === next.card.id &&
  prev.isActive === next.isActive &&
  prev.audioEnabled === next.audioEnabled &&
  prev.quizAnswer === next.quizAnswer &&
  prev.userId === next.userId &&
  prev.onAnswer === next.onAnswer &&
  prev.onJumpToCard === next.onJumpToCard &&
  prev.onFrameChange === next.onFrameChange,
);
