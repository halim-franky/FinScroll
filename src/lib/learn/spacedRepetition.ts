/**
 * Spaced repetition tracking.
 *
 * When a user answers a quiz incorrectly, we mark the card for review
 * at 3, 7, 14, and 30 days from now. The feed re-surfaces cards that
 * are due, in front of new content.
 */

export interface ReviewEntry {
  cardId: string | number;
  failedAt: number;
  nextReviewAt: number;
  stage: number;            // 0..3 (3d, 7d, 14d, 30d)
}

const INTERVALS_DAYS = [3, 7, 14, 30];

const STORAGE_KEY = (uid: string) => `finscroll_review_${uid}`;

function loadAll(userId: string): ReviewEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is ReviewEntry =>
        r !== null &&
        typeof r === "object" &&
        typeof r.cardId !== "undefined" &&
        typeof r.nextReviewAt === "number"
    );
  } catch {
    return [];
  }
}

function persist(userId: string, entries: ReviewEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(entries));
  } catch {}
}

/** Call when a user fails a quiz on a card. */
export function recordFailure(userId: string, cardId: string | number): void {
  const all = loadAll(userId);
  const now = Date.now();
  const next = now + INTERVALS_DAYS[0] * 24 * 60 * 60 * 1000;
  const existingIdx = all.findIndex((r) => String(r.cardId) === String(cardId));
  const entry: ReviewEntry = {
    cardId,
    failedAt: now,
    nextReviewAt: next,
    stage: 0,
  };
  if (existingIdx >= 0) all[existingIdx] = entry;
  else all.push(entry);
  persist(userId, all);
}

/** Call when a user PASSES a quiz on a card that was previously marked. */
export function recordPass(userId: string, cardId: string | number): void {
  const all = loadAll(userId);
  const existingIdx = all.findIndex((r) => String(r.cardId) === String(cardId));
  if (existingIdx < 0) return;
  const entry = all[existingIdx];
  if (entry.stage >= INTERVALS_DAYS.length - 1) {
    // Mastered — remove from review queue
    all.splice(existingIdx, 1);
  } else {
    // Advance to next interval
    const nextStage = entry.stage + 1;
    all[existingIdx] = {
      ...entry,
      stage: nextStage,
      nextReviewAt: Date.now() + INTERVALS_DAYS[nextStage] * 24 * 60 * 60 * 1000,
    };
  }
  persist(userId, all);
}

/** Returns ids of cards currently due for review (sorted oldest-failure-first). */
export function dueCardIds(userId: string, now = Date.now()): (string | number)[] {
  return loadAll(userId)
    .filter((r) => r.nextReviewAt <= now)
    .sort((a, b) => a.failedAt - b.failedAt)
    .map((r) => r.cardId);
}

/** How many cards are currently in the review queue. */
export function dueCount(userId: string, now = Date.now()): number {
  return dueCardIds(userId, now).length;
}
