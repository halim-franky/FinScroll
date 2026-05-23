"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ChevronLeft, Sparkles,
  PiggyBank, CreditCard, TrendingUp, Layers,
  Target, Briefcase, Shield, Hammer,
} from "lucide-react";
import { pushStateDebounced } from "@/lib/cloudSync";
import { slideX, SPRING_TIGHT, SPRING_BOUNCY } from "@/lib/motion";

// ── Type definitions ─────────────────────────────────────────────
export type Struggle = "saving" | "debt" | "investing" | "all";
export type Goal = "first_1k" | "first_investment" | "pay_debt" | "emergency_fund";

export interface OnboardingData {
  struggle: Struggle;
  scrollHours: number;
  goal: Goal;
  completed: boolean;
  skipped: boolean;
  completedAt: string;
}

// ── Whitelist of valid values for storage validation ─────────────
const VALID_STRUGGLES: readonly Struggle[] = ["saving", "debt", "investing", "all"] as const;
const VALID_GOALS: readonly Goal[] = ["first_1k", "first_investment", "pay_debt", "emergency_fund"] as const;
const VALID_HOURS = [2, 4, 6, 9] as const;

const STRUGGLE_OPTIONS = [
  { id: "saving" as const, icon: PiggyBank, label: "Saving", desc: "I can't save consistently" },
  { id: "debt" as const, icon: CreditCard, label: "Debt", desc: "I have debt I can't pay off" },
  { id: "investing" as const, icon: TrendingUp, label: "Investing", desc: "I don't know where to invest" },
  { id: "all" as const, icon: Layers, label: "All of it", desc: "I'm overwhelmed by everything" },
];

const HOUR_OPTIONS = [
  { hrs: 2, label: "1–2 hrs", desc: "Light scroller" },
  { hrs: 4, label: "3–4 hrs", desc: "Moderate" },
  { hrs: 6, label: "5–7 hrs", desc: "Gen Z average" },
  { hrs: 9, label: "8+ hrs", desc: "Heavy doomscroller" },
];

const GOAL_OPTIONS = [
  { id: "first_1k" as const, icon: Target, label: "Save my first $1k", desc: "Build a safety cushion" },
  { id: "first_investment" as const, icon: Briefcase, label: "Make my first investment", desc: "Start compounding wealth" },
  { id: "pay_debt" as const, icon: Hammer, label: "Pay off my debt", desc: "Get out of the red" },
  { id: "emergency_fund" as const, icon: Shield, label: "Build emergency fund", desc: "3–6 months of expenses" },
];

interface Props {
  userId: string;
  onComplete: (data: OnboardingData) => void;
}

export function OnboardingModal({ userId, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [struggle, setStruggle] = useState<Struggle | null>(null);
  const [scrollHours, setScrollHours] = useState<number | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);

  const totalSteps = 3;

  const finish = (data: OnboardingData) => {
    try {
      localStorage.setItem(
        `finscroll_onboarding_${userId}`,
        JSON.stringify(data)
      );
    } catch {}
    // Fire-and-forget cloud sync — degrades gracefully if Supabase isn't set up
    pushStateDebounced(userId, 500);
    onComplete(data);
  };

  const handleSkip = () => {
    finish({
      struggle: "all",
      scrollHours: 4,
      goal: "first_1k",
      completed: true,
      skipped: true,
      completedAt: new Date().toISOString(),
    });
  };

  const handleFinish = () => {
    // Strict validation — only accept whitelisted values
    if (!struggle || !VALID_STRUGGLES.includes(struggle)) return;
    if (scrollHours === null || !VALID_HOURS.includes(scrollHours as 2 | 4 | 6 | 9)) return;
    if (!goal || !VALID_GOALS.includes(goal)) return;

    finish({
      struggle,
      scrollHours,
      goal,
      completed: true,
      skipped: false,
      completedAt: new Date().toISOString(),
    });
  };

  const canAdvance =
    (step === 0 && struggle !== null) ||
    (step === 1 && scrollHours !== null) ||
    (step === 2 && goal !== null);

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col max-w-md mx-auto">
      {/* Top bar: progress + skip */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === step
                  ? "w-8 bg-emerald-400"
                  : i < step
                  ? "w-6 bg-emerald-400/60"
                  : "w-6 bg-zinc-800"
              }`}
            />
          ))}
        </div>
        <button
          onClick={handleSkip}
          className="text-xs text-zinc-300 hover:text-white transition-colors font-medium"
        >
          Skip
        </button>
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col px-5 py-4 overflow-y-auto relative">
        <AnimatePresence mode="wait" custom={1}>
        <motion.div
          key={step}
          custom={1}
          variants={slideX}
          initial="enter"
          animate="center"
          exit="exit"
          className="w-full"
        >
        {step === 0 && (
          <StepShell
            badge="Question 1 of 3"
            title="What's your biggest money struggle?"
            subtitle="We'll tailor your learning path to match."
          >
            <div className="space-y-3">
              {STRUGGLE_OPTIONS.map(({ id, icon: Icon, label, desc }) => {
                const selected = struggle === id;
                return (
                  <motion.button
                    key={id}
                    whileTap={{ scale: 0.97 }}
                    transition={SPRING_TIGHT}
                    onClick={() => setStruggle(id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                      selected
                        ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.15)]"
                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                        selected
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold text-sm ${selected ? "text-white" : "text-zinc-200"}`}>
                        {label}
                      </div>
                      <div className="text-xs text-zinc-300 mt-0.5">{desc}</div>
                    </div>
                    {selected && (
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </StepShell>
        )}

        {step === 1 && (
          <StepShell
            badge="Question 2 of 3"
            title="How much do you scroll per day?"
            subtitle="Honest answer wins. We'll calculate the real opportunity cost."
          >
            <div className="grid grid-cols-2 gap-3">
              {HOUR_OPTIONS.map(({ hrs, label, desc }) => {
                const selected = scrollHours === hrs;
                return (
                  <motion.button
                    key={hrs}
                    whileTap={{ scale: 0.96 }}
                    transition={SPRING_TIGHT}
                    onClick={() => setScrollHours(hrs)}
                    className={`p-4 rounded-2xl border transition-all text-center ${
                      selected
                        ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.15)]"
                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className={`text-2xl font-black tracking-tight mb-1 ${selected ? "text-emerald-400" : "text-zinc-200"}`}>
                      {label}
                    </div>
                    <div className="text-[11px] text-zinc-300 font-medium">{desc}</div>
                  </motion.button>
                );
              })}
            </div>
            {scrollHours !== null && (
              <div className="mt-5 p-4 bg-rose-500/5 border border-rose-500/15 rounded-2xl">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  At <strong className="text-rose-400">{scrollHours} hrs/day</strong> and just $3 of impulse spending per hour,
                  that's{" "}
                  <strong className="text-rose-400">
                    ${Math.round(scrollHours * 3 * 365).toLocaleString()}/year
                  </strong>{" "}
                  you could be investing. We'll show the 30-year compound cost on the next screen.
                </p>
              </div>
            )}
          </StepShell>
        )}

        {step === 2 && (
          <StepShell
            badge="Question 3 of 3"
            title="What's your first money goal?"
            subtitle="We'll prioritize content that gets you there fastest."
          >
            <div className="space-y-3">
              {GOAL_OPTIONS.map(({ id, icon: Icon, label, desc }) => {
                const selected = goal === id;
                return (
                  <motion.button
                    key={id}
                    whileTap={{ scale: 0.97 }}
                    transition={SPRING_TIGHT}
                    onClick={() => setGoal(id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                      selected
                        ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.15)]"
                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                        selected
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold text-sm ${selected ? "text-white" : "text-zinc-200"}`}>
                        {label}
                      </div>
                      <div className="text-xs text-zinc-300 mt-0.5">{desc}</div>
                    </div>
                    {selected && <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </motion.button>
                );
              })}
            </div>
          </StepShell>
        )}
        </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom action bar */}
      <div className="px-5 py-5 border-t border-zinc-900 bg-zinc-950">
        <div className="flex items-center gap-3">
          {step > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              transition={SPRING_TIGHT}
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center justify-center gap-1 px-4 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors text-sm font-bold"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </motion.button>
          )}
          <motion.button
            whileTap={canAdvance ? { scale: 0.97 } : undefined}
            animate={canAdvance ? { scale: [1, 1.03, 1] } : { scale: 1 }}
            transition={
              canAdvance
                ? { duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }
                : SPRING_TIGHT
            }
            onClick={() => {
              if (!canAdvance) return;
              if (step < totalSteps - 1) setStep((s) => s + 1);
              else handleFinish();
            }}
            disabled={!canAdvance}
            className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl font-extrabold text-sm transition-all ${
              canAdvance
                ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-[0_0_25px_rgba(16,185,129,0.3)]"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            }`}
          >
            {step < totalSteps - 1 ? "Continue" : "Start Learning"}
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ── Reusable step layout ─────────────────────────────────────────
function StepShell({
  badge,
  title,
  subtitle,
  children,
}: {
  badge: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="mb-6">
        <span className="inline-block text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full mb-3">
          {badge}
        </span>
        <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
          {title}
        </h2>
        <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">{subtitle}</p>
      </div>
      {children}
    </>
  );
}

// ── Read helper for other components ─────────────────────────────
export function readOnboarding(userId: string): OnboardingData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`finscroll_onboarding_${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    // Defensive validation — reject any tampered/malformed data
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !VALID_STRUGGLES.includes(parsed.struggle) ||
      typeof parsed.scrollHours !== "number" ||
      parsed.scrollHours < 1 ||
      parsed.scrollHours > 24 ||
      !VALID_GOALS.includes(parsed.goal) ||
      typeof parsed.completed !== "boolean"
    ) {
      return null;
    }
    return parsed as OnboardingData;
  } catch {
    return null;
  }
}
