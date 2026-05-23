/**
 * Shared motion variants and helpers.
 *
 * Keeps animation tuning in one place so the whole app feels coherent.
 * Easing and durations chosen to feel snappy but premium:
 *   - 200-300ms for micro-interactions
 *   - 350-450ms for screen-level transitions
 *   - Spring physics for tactile feedback (button taps, selections)
 *   - Linear-out-fast-in for entrances
 */
import type { Variants, Transition } from "framer-motion";

// ── Easing curves ─────────────────────────────────────────────────
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;        // smooth entrance
export const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const;       // material curve
export const SPRING_TIGHT: Transition = { type: "spring", stiffness: 400, damping: 28 };
export const SPRING_SOFT: Transition = { type: "spring", stiffness: 200, damping: 22 };
export const SPRING_BOUNCY: Transition = { type: "spring", stiffness: 380, damping: 15 };

// ── Common variants ───────────────────────────────────────────────

/** Fade up — content entering the viewport (0 → opaque, +12px → 0). */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE_OUT },
  },
};

/** Fade down — for content above an action. */
export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT } },
};

/** Scale-in — for selected states, badges. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: {
    opacity: 1,
    scale: 1,
    transition: SPRING_TIGHT,
  },
};

/** Pop — bigger scale-pop for hero moments (e.g. correct quiz). */
export const pop: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  show: {
    opacity: 1,
    scale: [0.6, 1.12, 1],
    transition: { duration: 0.5, times: [0, 0.55, 1], ease: EASE_OUT },
  },
};

/** Container that staggers children's entrance. */
export const stagger: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

/** Stagger faster — for tight lists. */
export const staggerFast: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

/** Slide horizontal — used for Story frame transitions. */
export const slideX: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.35, ease: EASE_OUT },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
    transition: { duration: 0.25, ease: EASE_IN_OUT },
  }),
};

/** Shake — for incorrect quiz answer (gentle 4-cycle horizontal). */
export const shake: Variants = {
  shake: {
    x: [0, -6, 6, -4, 4, 0],
    transition: { duration: 0.35, ease: EASE_IN_OUT },
  },
};

/** Tap feedback — for button press. */
export const tap = {
  whileTap: { scale: 0.95 },
  transition: SPRING_TIGHT,
};

/** Hover lift — for selectable cards. */
export const hoverLift = {
  whileHover: { y: -2, scale: 1.01 },
  transition: SPRING_TIGHT,
};

// ── Reduced motion helper ─────────────────────────────────────────

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}
