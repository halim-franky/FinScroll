"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hand, ChevronUp, ChevronRight, X, Sparkles } from "lucide-react";

const STORAGE_KEY = "fs_tutorial_done";

interface Props {
  /** Force the tutorial open (e.g. from a "Replay tutorial" button). */
  open?: boolean;
  /** Called when the tutorial dismisses, whether via Got it or Skip. */
  onClose?: () => void;
}

interface Step {
  id: string;
  title: string;
  body: string;
  /** Which gesture animation to play in the demo area. */
  gesture: "swipeUp" | "tapRight" | "fiveFrames";
}

const STEPS: readonly Step[] = [
  {
    id: "swipe-up",
    title: "Swipe up for the next topic",
    body: "Each card is a complete mini-lesson. Swipe up to jump to a new financial concept.",
    gesture: "swipeUp",
  },
  {
    id: "tap-right",
    title: "Tap right to dig deeper",
    body: "Every topic unfolds in 5 frames. Tap the right side of the screen (or the chevron) to advance through them.",
    gesture: "tapRight",
  },
  {
    id: "five-frames",
    title: "Video · Visualize · Insight · Quiz · Proof",
    body: "A short video, a data view, the takeaway, a knowledge check, then a shareable proof of attention — a personalized snapshot of what you just earned.",
    gesture: "fiveFrames",
  },
];

/**
 * One-time guided tour for the Learn feed.
 *
 * Shown on the user's first visit to /feed in story mode. Three concise
 * steps each demonstrate a core gesture with a looping finger animation,
 * so the user learns by mimicry rather than reading instructions.
 *
 * State is persisted in localStorage; the overlay never shows again once
 * dismissed (Skip or Got it).
 */
export function FeedTutorial({ open: forceOpen, onClose }: Props = {}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  // On mount: auto-show for first-time users.
  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) setOpen(true);
    } catch {}
  }, []);

  // External control: parent can force the tutorial open via prop (replay).
  useEffect(() => {
    if (forceOpen) {
      setStep(0);
      setOpen(true);
    }
  }, [forceOpen]);

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setOpen(false);
    onClose?.();
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else finish();
  };

  const current = STEPS[step];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-sm"
          onClick={finish}
        >
          <motion.div
            key={current.id}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                  How FinScroll works
                </span>
              </div>
              <button
                onClick={finish}
                aria-label="Skip tutorial"
                className="p-1.5 rounded-lg text-zinc-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Gesture demo area */}
            <div className="relative h-44 mx-5 my-2 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden">
              <GestureDemo gesture={current.gesture} />
            </div>

            {/* Copy */}
            <div className="px-5 py-3 space-y-2">
              <h3 className="text-lg font-black text-white tracking-tight">
                {current.title}
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">{current.body}</p>
            </div>

            {/* Progress + actions */}
            <div className="px-5 pb-5 space-y-3">
              <div className="flex items-center gap-1.5">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                      i === step
                        ? "bg-emerald-400"
                        : i < step
                        ? "bg-emerald-400/40"
                        : "bg-zinc-800"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    className="flex-shrink-0 h-11 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-sm transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={next}
                  className="flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-sm flex items-center justify-center gap-1 transition-colors"
                >
                  {step < STEPS.length - 1 ? "Next" : "Got it"}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Five-frame tap-right demo (declared above the dispatcher so we
//    can reference it cleanly) ───────────────────────────────────────
const TAP_FRAMES = [
  {
    emoji: "🎬",
    label: "Video",
    bg: "from-emerald-500/15 to-emerald-700/10",
    text: "text-emerald-200",
  },
  {
    emoji: "📊",
    label: "Visual",
    bg: "from-sky-500/15 to-sky-700/10",
    text: "text-sky-200",
  },
  {
    emoji: "💡",
    label: "Insight",
    bg: "from-amber-500/15 to-amber-700/10",
    text: "text-amber-200",
  },
  {
    emoji: "❓",
    label: "Quiz",
    bg: "from-violet-500/15 to-violet-700/10",
    text: "text-violet-200",
  },
  {
    emoji: "✅",
    label: "Proof",
    bg: "from-rose-500/15 to-rose-700/10",
    text: "text-rose-200",
  },
] as const;

const TAP_CYCLE_MS = 2200;
// The hand-press keyframe lands at 35% of the cycle (see hand transition
// `times` below). The frame swap MUST fire at this exact moment so the
// user sees press → frame-change as one tight cause-and-effect beat.
// Without this offset, the press happens 1.4 s before the frame moves —
// the demo feels broken.
const TAP_PRESS_OFFSET_MS = Math.round(TAP_CYCLE_MS * 0.35); // ≈ 770ms

function TapRightDemo() {
  const [frame, setFrame] = useState(0);

  // Sync the frame swap with the hand-press moment in every cycle:
  //   1. Wait until the first hand-press completes (770ms after mount)
  //   2. Then advance one frame every TAP_CYCLE_MS so subsequent presses
  //      and frame swaps stay locked together for the lifetime of the demo.
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const initial = setTimeout(() => {
      setFrame((f) => (f + 1) % TAP_FRAMES.length);
      interval = setInterval(() => {
        setFrame((f) => (f + 1) % TAP_FRAMES.length);
      }, TAP_CYCLE_MS);
    }, TAP_PRESS_OFFSET_MS);

    return () => {
      clearTimeout(initial);
      if (interval) clearInterval(interval);
    };
  }, []);

  const cycle = {
    duration: TAP_CYCLE_MS / 1000,
    repeat: Infinity,
    ease: "easeOut" as const,
  };

  const current = TAP_FRAMES[frame];

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 5 progress dots — light up to the current frame index */}
      <div className="absolute top-3 left-3 right-3 flex items-center gap-1 z-20">
        {TAP_FRAMES.map((_, i) => (
          <div
            key={i}
            className="h-0.5 flex-1 rounded-full transition-colors duration-300"
            style={{
              backgroundColor:
                i < frame
                  ? "rgba(16,185,129,0.6)"
                  : i === frame
                  ? "rgba(255,255,255,0.85)"
                  : "rgba(255,255,255,0.15)",
            }}
          />
        ))}
      </div>

      {/* Sliding frame card — re-keyed on each tap so AnimatePresence runs */}
      <div className="absolute inset-x-6 top-10 bottom-10 rounded-xl border border-zinc-700/60 overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={frame}
            initial={{ x: 120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -120, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute inset-0 bg-gradient-to-br ${current.bg} flex flex-col items-center justify-center gap-1`}
          >
            <span className="text-2xl">{current.emoji}</span>
            <span
              className={`text-[9px] font-black uppercase tracking-widest ${current.text}`}
            >
              {current.label}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Hand + ripple — same pulse on every tap cycle, looping forever */}
      <div
        className="absolute z-30"
        style={{
          top: "50%",
          left: "calc(50% + 3rem)",
          transform: "translateY(-50%)",
        }}
      >
        <div className="relative w-12 h-12 flex items-center justify-center">
          {/* Idle ring stays visible at all times */}
          <div className="absolute w-12 h-12 rounded-full border border-emerald-500/30" />
          {/* Ripple — expands at the moment of tap each cycle */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{
              scale: [0.6, 0.6, 1.4, 1.4, 0.6],
              opacity: [0, 0, 0.7, 0, 0],
            }}
            transition={{
              ...cycle,
              times: [0, 0.35, 0.55, 0.8, 1],
            }}
            className="absolute w-12 h-12 rounded-full border-2 border-emerald-400"
          />
          {/* Hand: lowers from above, presses, lifts back */}
          <motion.div
            initial={{ y: -22, opacity: 0, scale: 1 }}
            animate={{
              y: [-22, 2, 2, -22, -22],
              opacity: [0, 1, 1, 0, 0],
              scale: [1, 0.88, 0.88, 1, 1],
            }}
            transition={{
              ...cycle,
              times: [0, 0.35, 0.6, 0.95, 1],
            }}
            className="text-emerald-300 absolute"
          >
            <Hand className="w-10 h-10 drop-shadow-[0_4px_10px_rgba(16,185,129,0.4)]" />
          </motion.div>
        </div>
      </div>

      {/* Floating "Tap right" label */}
      <span className="absolute bottom-3 left-0 right-0 flex justify-center text-[10px] font-black uppercase tracking-widest text-emerald-300 z-20">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-900/70 backdrop-blur-sm">
          Tap right <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </span>
    </div>
  );
}

// ── Looping finger-gesture animation ─────────────────────────────────
function GestureDemo({ gesture }: { gesture: Step["gesture"] }) {
  if (gesture === "swipeUp") {
    // Two real-looking cards sliding upward in lockstep to demonstrate the
    // scroll-snap behaviour: the top one exits and the next slides up to
    // take its place. The hand mirrors the same upward motion.
    const cardCycle = {
      duration: 2.4,
      times: [0, 0.18, 0.78, 1],
      repeat: Infinity,
      repeatDelay: 0.4,
      ease: "easeInOut" as const,
    };

    return (
      <div className="absolute inset-0 overflow-hidden">
        {/* Card A — starts in view, slides up and out */}
        <motion.div
          initial={{ y: 0, opacity: 1 }}
          animate={{ y: [0, 0, -160, -160], opacity: [1, 1, 0, 0] }}
          transition={cardCycle}
          className="absolute inset-x-8 top-6 h-24 rounded-xl border border-emerald-400/60 bg-gradient-to-br from-emerald-500/15 to-emerald-700/10 flex items-center justify-center px-3"
        >
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300">
            Topic 1
          </span>
        </motion.div>

        {/* Card B — starts off-screen below, slides up into view */}
        <motion.div
          initial={{ y: 160, opacity: 0 }}
          animate={{ y: [160, 160, 0, 0], opacity: [0, 0, 1, 1] }}
          transition={cardCycle}
          className="absolute inset-x-8 top-6 h-24 rounded-xl border border-emerald-400/60 bg-gradient-to-br from-emerald-500/15 to-emerald-700/10 flex items-center justify-center px-3"
        >
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300">
            Topic 2
          </span>
        </motion.div>

        {/* Hand traces the swipe path on top of the cards */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: [40, 40, -40, -40], opacity: [0, 1, 1, 0] }}
          transition={cardCycle}
          className="absolute left-1/2 -translate-x-1/2 bottom-10 text-emerald-200"
        >
          <Hand className="w-9 h-9 drop-shadow-[0_4px_10px_rgba(16,185,129,0.5)]" />
        </motion.div>

        {/* Floating label */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
          <motion.span
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-900/70 backdrop-blur-sm text-[10px] font-black uppercase tracking-widest text-emerald-300"
          >
            <ChevronUp className="w-3 h-3" />
            Swipe up
          </motion.span>
        </div>
      </div>
    );
  }

  if (gesture === "tapRight") return <TapRightDemo />;

  // fiveFrames — 5 mini-cards lighting up sequentially. Slower cadence so
  // the user can read each label before the next one takes focus.
  const FRAMES = [
    { emoji: "🎬", label: "Video" },
    { emoji: "📊", label: "Data" },
    { emoji: "💡", label: "Insight" },
    { emoji: "❓", label: "Quiz" },
    { emoji: "✅", label: "Proof" },
  ];
  const HIGHLIGHT_DURATION = 1.4;   // how long each box stays highlighted
  const STAGGER = 1.0;              // gap between each box lighting up
  const TOTAL_CYCLE = FRAMES.length * STAGGER + 0.4;

  return (
    <div className="absolute inset-0 flex items-center justify-center px-4 gap-1.5">
      {FRAMES.map((f, i) => (
        <motion.div
          key={f.label}
          initial={{ opacity: 0.25, scale: 0.92 }}
          animate={{
            opacity: [0.25, 1, 0.25],
            scale: [0.92, 1.06, 0.92],
            borderColor: [
              "rgba(63,63,70,0.6)",
              "rgba(16,185,129,0.7)",
              "rgba(63,63,70,0.6)",
            ],
          }}
          transition={{
            duration: HIGHLIGHT_DURATION,
            delay: i * STAGGER,
            repeat: Infinity,
            repeatDelay: TOTAL_CYCLE - HIGHLIGHT_DURATION,
            ease: "easeInOut",
          }}
          className="flex-1 aspect-[3/4] rounded-lg border bg-zinc-900/80 flex flex-col items-center justify-center gap-1"
        >
          <span className="text-lg leading-none">{f.emoji}</span>
          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-200">
            {f.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
