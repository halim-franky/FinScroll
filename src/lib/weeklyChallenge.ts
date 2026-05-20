/**
 * Weekly challenge logic.
 *
 * A "week" begins at Monday 00:00 in the user's local timezone.
 * Progress is computed from the FinTokFeed's persisted weeklyLog
 * (an array of millisecond timestamps when the user answered a
 * quiz correctly). The current challenge is fixed for the MVP —
 * future versions can rotate from a pool.
 */

export interface Challenge {
  id: string;
  title: string;
  description: string;
  goal: number;
  rewardLabel: string;
}

export const CURRENT_CHALLENGE: Challenge = {
  id: "master-5-this-week",
  title: "Master 5 concepts this week",
  description: "Answer 5 quiz questions correctly between Monday and Sunday.",
  goal: 5,
  rewardLabel: "+3 day streak shield",
};

/**
 * Returns the Date object for the start of this week (Monday 00:00 local).
 */
export function getWeekStart(now = new Date()): Date {
  const d = new Date(now);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday
  // Days to go back to reach Monday. If today is Sunday (0), go back 6 days.
  const diff = (day + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d;
}

/**
 * Returns the Date object for the next week-start (next Monday 00:00 local).
 */
export function getNextWeekStart(now = new Date()): Date {
  const start = getWeekStart(now);
  const next = new Date(start);
  next.setDate(next.getDate() + 7);
  return next;
}

/**
 * Human-readable countdown string until next reset.
 */
export function formatTimeUntilReset(now = new Date()): string {
  const next = getNextWeekStart(now);
  const ms = next.getTime() - now.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  if (days >= 1) return `${days}d ${hours}h`;
  return `${hours}h`;
}

/**
 * Counts how many quiz completions fall within the current week.
 * Accepts any iterable of timestamps; non-finite values are ignored.
 */
export function countThisWeek(timestamps: readonly number[], now = new Date()): number {
  const weekStart = getWeekStart(now).getTime();
  let count = 0;
  for (const t of timestamps) {
    if (Number.isFinite(t) && t >= weekStart) count++;
  }
  return count;
}

/**
 * Prunes timestamps older than 60 days to keep localStorage size bounded.
 */
export function pruneWeeklyLog(timestamps: readonly number[]): number[] {
  const cutoff = Date.now() - 60 * 24 * 60 * 60 * 1000;
  return timestamps.filter((t) => Number.isFinite(t) && t >= cutoff);
}
