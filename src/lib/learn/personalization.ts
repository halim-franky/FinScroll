/**
 * Onboarding-aware personalization for Frame 3 (Insight).
 *
 * Each card can declare a `personalizedTemplates` map keyed by the
 * user's `struggle` answer. We pick the best-matching template and
 * substitute placeholders with the user's actual onboarding answers.
 *
 * Placeholders supported:
 *   {scrollHours}     — daily scroll hours from onboarding
 *   {dailyCost}       — scrollHours * $3
 *   {monthlyCost}     — dailyCost * 30
 *   {yearlyCost}      — dailyCost * 365
 *   {struggle}        — human-readable struggle label
 *   {goal}            — human-readable goal label
 */

import type { OnboardingData, Struggle, Goal } from "@/components/OnboardingModal";

const STRUGGLE_LABEL: Record<Struggle, string> = {
  saving: "saving consistently",
  debt: "paying off debt",
  investing: "starting to invest",
  all: "all of the above",
};

const GOAL_LABEL: Record<Goal, string> = {
  first_1k: "saving your first $1k",
  first_investment: "making your first investment",
  pay_debt: "paying off your debt",
  emergency_fund: "building an emergency fund",
};

function substitute(template: string, onboarding: OnboardingData): string {
  const hourly = 3; // baseline impulse-buy rate per hour
  const daily = onboarding.scrollHours * hourly;
  const monthly = Math.round(daily * 30);
  const yearly = Math.round(daily * 365);

  return template
    .replace(/{scrollHours}/g, String(onboarding.scrollHours))
    .replace(/{dailyCost}/g, `$${daily}`)
    .replace(/{monthlyCost}/g, `$${monthly}`)
    .replace(/{yearlyCost}/g, `$${yearly}`)
    .replace(/{struggle}/g, STRUGGLE_LABEL[onboarding.struggle])
    .replace(/{goal}/g, GOAL_LABEL[onboarding.goal]);
}

export function personalizedLine(
  templates: Partial<Record<string, string>> | undefined,
  onboarding: OnboardingData | null
): string | null {
  if (!onboarding || onboarding.skipped) return null;
  if (!templates) return null;

  // Prefer struggle-specific, fall back to goal-specific, then "default"
  const candidate =
    templates[onboarding.struggle] ??
    templates[onboarding.goal] ??
    templates["default"];

  if (!candidate) return null;
  return substitute(candidate, onboarding);
}

export type { Struggle, Goal };
