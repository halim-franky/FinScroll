/**
 * Client-side cloud sync helpers.
 *
 * Bridges between localStorage (primary, fast, offline-capable) and
 * Supabase (authoritative, cross-device) via the /api/me/state endpoint.
 *
 * The localStorage write is always the trigger. We debounce server
 * pushes to coalesce rapid changes (e.g. liking many cards in a row).
 */

const ONBOARDING_KEY = (uid: string) => `finscroll_onboarding_${uid}`;
const PROGRESS_KEY = (uid: string) => `finscroll_v2_${uid}`;

interface ServerOnboarding {
  struggle: "saving" | "debt" | "investing" | "all";
  scroll_hours: number;
  goal: "first_1k" | "first_investment" | "pay_debt" | "emergency_fund";
  skipped: boolean;
  completed_at?: string;
}

interface ServerProgress {
  streak?: number;
  streak_date?: string | null;
  completed?: Record<string, boolean>;
  liked?: Record<string, boolean>;
  saved?: Record<string, boolean>;
  weekly_log?: number[];
  updated_at?: string;
}

// ── Pull state from server and merge into localStorage ────────────────
export async function pullState(userId: string): Promise<{
  pulled: boolean;
  configured: boolean;
}> {
  if (typeof window === "undefined") return { pulled: false, configured: false };

  try {
    const res = await fetch("/api/me/state", {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return { pulled: false, configured: false };

    const data: {
      configured: boolean;
      onboarding: ServerOnboarding | null;
      progress: ServerProgress | null;
    } = await res.json();

    if (!data.configured) return { pulled: false, configured: false };

    // Onboarding: prefer server if local is missing
    if (data.onboarding) {
      const localRaw = localStorage.getItem(ONBOARDING_KEY(userId));
      if (!localRaw) {
        const localShape = {
          struggle: data.onboarding.struggle,
          scrollHours: data.onboarding.scroll_hours,
          goal: data.onboarding.goal,
          completed: true,
          skipped: data.onboarding.skipped,
          completedAt: data.onboarding.completed_at ?? new Date().toISOString(),
        };
        localStorage.setItem(ONBOARDING_KEY(userId), JSON.stringify(localShape));
      }
    }

    // Progress: merge server into local — server's completed/liked/saved are
    // union-merged with local (so progress on either device is preserved).
    if (data.progress) {
      const localRaw = localStorage.getItem(PROGRESS_KEY(userId));
      const local = localRaw ? JSON.parse(localRaw) : {};
      const merged = {
        liked: { ...(data.progress.liked ?? {}), ...(local.liked ?? {}) },
        saved: { ...(data.progress.saved ?? {}), ...(local.saved ?? {}) },
        completed: { ...(data.progress.completed ?? {}), ...(local.completed ?? {}) },
        weeklyLog: dedupSorted(
          (data.progress.weekly_log ?? []).concat(local.weeklyLog ?? [])
        ),
      };
      localStorage.setItem(PROGRESS_KEY(userId), JSON.stringify(merged));

      // Streak: take whichever is higher (avoids accidental reset)
      const localStreak = parseInt(localStorage.getItem("fs_streak") ?? "0", 10);
      const serverStreak = data.progress.streak ?? 0;
      if (serverStreak > localStreak) {
        localStorage.setItem("fs_streak", String(serverStreak));
        if (data.progress.streak_date) {
          localStorage.setItem("fs_streak_date", data.progress.streak_date);
        }
      }
    }

    return { pulled: true, configured: true };
  } catch {
    return { pulled: false, configured: false };
  }
}

// ── Push state (debounced) ────────────────────────────────────────────
let pushTimer: ReturnType<typeof setTimeout> | null = null;

export function pushStateDebounced(userId: string, delay = 2000): void {
  if (typeof window === "undefined") return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void doPush(userId);
  }, delay);
}

async function doPush(userId: string): Promise<void> {
  try {
    const onboarding = readOnboardingForServer(userId);
    const progress = readProgressForServer(userId);

    if (!onboarding && !progress) return;

    await fetch("/api/me/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboarding, progress }),
    });
  } catch {
    // Silent fail — localStorage remains the source of truth
  }
}

// ── Local → server shape converters ───────────────────────────────────
function readOnboardingForServer(userId: string): ServerOnboarding | undefined {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY(userId));
    if (!raw) return undefined;
    const local = JSON.parse(raw);
    if (!local || typeof local !== "object" || !local.completed) return undefined;
    return {
      struggle: local.struggle,
      scroll_hours: local.scrollHours,
      goal: local.goal,
      skipped: !!local.skipped,
      completed_at: local.completedAt,
    };
  } catch {
    return undefined;
  }
}

function readProgressForServer(userId: string): ServerProgress | undefined {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY(userId));
    const streak = parseInt(localStorage.getItem("fs_streak") ?? "0", 10);
    const streakDate = localStorage.getItem("fs_streak_date");

    const out: ServerProgress = {};

    if (raw) {
      const local = JSON.parse(raw);
      if (local && typeof local === "object") {
        if (local.completed) out.completed = local.completed;
        if (local.liked) out.liked = local.liked;
        if (local.saved) out.saved = local.saved;
        if (Array.isArray(local.weeklyLog)) out.weekly_log = local.weeklyLog;
      }
    }

    if (streak > 0) out.streak = streak;
    if (streakDate) out.streak_date = streakDate;

    return Object.keys(out).length === 0 ? undefined : out;
  } catch {
    return undefined;
  }
}

function dedupSorted(arr: number[]): number[] {
  return Array.from(new Set(arr.filter((n) => Number.isFinite(n)))).sort();
}
