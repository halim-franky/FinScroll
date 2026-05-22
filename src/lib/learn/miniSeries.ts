/**
 * Mini-series definitions and unlock logic.
 *
 * A mini-series is a curated set of 5 cards on a single theme,
 * gated behind a prerequisite (e.g. master 3 Beginner cards to
 * unlock the "Debt Killer Path" series).
 */

export interface MiniSeries {
  id: string;
  title: string;
  description: string;
  emoji: string;
  cardIds: (string | number)[];
  prerequisite: {
    minCompletedCount?: number;     // master at least N cards in total
    minCompletedLevel?: string;     // master at least N cards at a given level
    completedLevelCount?: number;
  };
}

export const MINI_SERIES: readonly MiniSeries[] = [
  {
    id: "debt-killer",
    title: "Debt Killer Path",
    description: "Five science-backed moves to escape debt for good.",
    emoji: "⛓️",
    cardIds: [1, 2, 3, 4, 6],
    prerequisite: { minCompletedCount: 3 },
  },
  {
    id: "first-investment",
    title: "First Investment Playbook",
    description: "From zero to your first real index-fund purchase.",
    emoji: "🌱",
    cardIds: [3, 5, 7, 8, 9],
    prerequisite: { minCompletedCount: 5 },
  },
  {
    id: "tax-stack",
    title: "Tax-Advantaged Stack",
    description: "Layer Roth + HSA + 401k to legally pay less tax.",
    emoji: "🏛️",
    cardIds: [6, 9, 10, 11, 12],
    prerequisite: { minCompletedLevel: "Intermediate", completedLevelCount: 2 },
  },
  {
    id: "quant-foundations",
    title: "Quant Foundations",
    description: "The math behind serious portfolio decisions.",
    emoji: "📐",
    cardIds: [10, 11, 12],
    prerequisite: { minCompletedLevel: "Advanced", completedLevelCount: 1 },
  },
] as const;

export function isUnlocked(
  series: MiniSeries,
  completedIds: (string | number)[],
  completedByLevel: Record<string, number>
): boolean {
  const { prerequisite } = series;
  if (prerequisite.minCompletedCount !== undefined) {
    if (completedIds.length < prerequisite.minCompletedCount) return false;
  }
  if (
    prerequisite.minCompletedLevel !== undefined &&
    prerequisite.completedLevelCount !== undefined
  ) {
    const count = completedByLevel[prerequisite.minCompletedLevel] ?? 0;
    if (count < prerequisite.completedLevelCount) return false;
  }
  return true;
}

export function progressFor(
  series: MiniSeries,
  completedIds: (string | number)[]
): { done: number; total: number; ratio: number } {
  const set = new Set(completedIds.map(String));
  const done = series.cardIds.filter((id) => set.has(String(id))).length;
  return { done, total: series.cardIds.length, ratio: done / series.cardIds.length };
}
