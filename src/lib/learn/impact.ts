/**
 * Compound-wealth opportunity engine.
 *
 * Translates a user's onboarding answers (scrollHours, struggle, goal)
 * into two numbers that nothing else in the financial-literacy space does:
 *
 *   1. perSecondRate — how much compound wealth (in 30-year future dollars)
 *      every second of focused learning recovers vs an equivalent second of
 *      mindless scrolling. Drives the live ticker on the Hook frame.
 *
 *   2. futureValue — what they would have in 30 years if they redirected
 *      25% of their daily scroll time into the same wealth-building habit
 *      this card teaches. Drives the personalized hero number on the
 *      Insight frame.
 *
 * Assumptions (intentionally conservative, footnoted in the UI):
 *   - $3/hr impulse-spending opportunity cost while scrolling
 *     (Gen-Z trend: small Amazon, DoorDash, in-app purchases, etc.)
 *   - 8% nominal annual return — the long-term S&P 500 average
 *   - 30-year horizon (someone in their 20s investing to retirement)
 *   - 25% scroll-time redirect — small enough to feel achievable
 *
 * If the user skipped onboarding we still return a reasonable default
 * based on the Gen-Z median of 6 hr/day scroll time.
 */

import type { OnboardingData } from "@/components/OnboardingModal";

export const HOURLY_OPPORTUNITY_COST = 3;
export const ANNUAL_RETURN = 0.08;
export const HORIZON_YEARS = 30;
export const REDIRECT_FRACTION = 0.25;

/** (1 + r)^n — compounding factor for a single lump sum over the horizon. */
const COMPOUND_FACTOR = Math.pow(1 + ANNUAL_RETURN, HORIZON_YEARS); // ≈ 10.06

/** Annuity FV factor — [(1+r)^n - 1] / r — for a stream of annual savings. */
const ANNUITY_FV_FACTOR = (COMPOUND_FACTOR - 1) / ANNUAL_RETURN; // ≈ 113.28

export interface Impact {
  /** scrollHours used for the calculation (after onboarding or default). */
  scrollHours: number;
  /** Annual dollars freed up if 25% of scroll time is redirected. */
  annualSavings: number;
  /** What that annual stream compounds into over 30 years at 8%. */
  futureValue: number;
  /** Compound future value recovered per second of attention. */
  perSecondRate: number;
  /** Horizon used (years). */
  horizonYears: number;
}

const DEFAULT_SCROLL_HOURS = 6; // Gen-Z median when onboarding is skipped

export function computeImpact(
  onboarding: OnboardingData | null,
): Impact {
  const scrollHours = onboarding?.skipped === false && onboarding?.scrollHours
    ? onboarding.scrollHours
    : DEFAULT_SCROLL_HOURS;

  const dailyRedirectHours = scrollHours * REDIRECT_FRACTION;
  const annualSavings = dailyRedirectHours * HOURLY_OPPORTUNITY_COST * 365;
  const futureValue = annualSavings * ANNUITY_FV_FACTOR;

  // Per-second present-value of impulse spending while scrolling,
  // compounded forward to a single 30-year future dollar.
  const perSecondPV = HOURLY_OPPORTUNITY_COST / 3600;
  const perSecondRate = perSecondPV * COMPOUND_FACTOR;

  return {
    scrollHours,
    annualSavings,
    futureValue,
    perSecondRate,
    horizonYears: HORIZON_YEARS,
  };
}

/**
 * Compact currency formatter for the hero number.
 * 123,456 → "$123K", 1,234,567 → "$1.2M", 78 → "$78".
 */
export function formatCompactCurrency(n: number): string {
  if (!isFinite(n)) return "$0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) {
    return `$${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  }
  if (abs >= 1_000) {
    return `$${Math.round(n / 1_000)}K`;
  }
  return `$${Math.round(n)}`;
}

/**
 * Tiny-currency formatter for the live ticker (cents matter for the first
 * minute or two of watching).
 *   $0.04, $0.42, $4.20, $42.00
 */
export function formatTickerCurrency(n: number): string {
  if (!isFinite(n) || n < 0) return "$0.00";
  if (n < 100) return `$${n.toFixed(2)}`;
  return `$${Math.round(n).toLocaleString()}`;
}
