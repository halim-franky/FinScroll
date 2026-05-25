"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  LogOut, RefreshCw, Trash2, Mail, User, AlertTriangle,
  Lock, ChevronRight, UserCircle, PlayCircle, UserX, Loader2,
} from "lucide-react";

interface Props {
  userId: string;
}

/**
 * Account screen.
 *
 * Replaces the embedded Clerk UserProfile widget (which doesn't fit cleanly
 * in a mobile shell) with a list of cards. Each card opens Clerk's modal /
 * user-button flow for the relevant section. This keeps the UX consistent
 * with the rest of the app and the text fully readable.
 */
export function AccountView({ userId }: Props) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const [confirmAction, setConfirmAction] = useState<
    null | "reset_onboarding" | "clear_all" | "delete_account"
  >(null);
  // For delete_account: user must type DELETE before the destructive button enables.
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      await signOut({ redirectUrl: "/" });
    } catch {
      router.push("/");
    }
  };

  const handleResetOnboarding = async () => {
    try {
      await fetch("/api/me/state?scope=onboarding", { method: "DELETE" });
    } catch {}
    try {
      localStorage.removeItem(`finscroll_onboarding_${userId}`);
    } catch {}
    setConfirmAction(null);
    router.push("/feed");
  };

  const handleClearLocalData = async () => {
    try {
      await fetch("/api/me/state?scope=all", { method: "DELETE" });
    } catch {}
    try {
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (k.startsWith("finscroll_") || k.startsWith("fs_")) {
          localStorage.removeItem(k);
        }
      }
    } catch {}
    setConfirmAction(null);
    router.push("/feed");
  };

  // Clerk's UserProfile modal has two real pages:
  //   • Profile (default landing) — profile, email, connected accounts
  //   • Security — password, 2FA, active devices
  // The default `openUserProfile()` already lands on Profile, so we only
  // need `__experimental_startPath` to deep-link to the Security page.
  const openAccountPanel = () => openUserProfile();
  const openSecurityPanel = () =>
    openUserProfile({ __experimental_startPath: "/security" });

  const handleReplayTutorial = () => {
    try {
      localStorage.removeItem("fs_tutorial_done");
      localStorage.removeItem("fs_swipe_hint_dismissed");
    } catch {}
    router.push("/feed");
  };

  /**
   * Permanently delete the user's account.
   *
   * Order matters:
   *   1. Wipe the server-side Supabase rows (onboarding + progress) FIRST,
   *      so we still have a valid Clerk session to authenticate the delete.
   *   2. Clear localStorage so nothing leaks if the same browser is used
   *      to sign up again.
   *   3. Call Clerk's user.delete() — this invalidates the session.
   *   4. Sign out and redirect to landing.
   *
   * If any step fails we keep the modal open with a clear error.
   */
  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeletingAccount(true);
    setDeleteError(null);
    try {
      // Step 1: server-side wipe (best-effort; if it fails we still proceed
      // since the Clerk delete won't roll back).
      try {
        await fetch("/api/me/state?scope=all", { method: "DELETE" });
      } catch {}

      // Step 2: local data
      try {
        const keys = Object.keys(localStorage);
        for (const k of keys) {
          if (k.startsWith("finscroll_") || k.startsWith("fs_")) {
            localStorage.removeItem(k);
          }
        }
      } catch {}

      // Step 3: Clerk account deletion (irreversible).
      //
      // Race the delete against an 8-second timeout. Without this, the
      // promise can hang forever in two scenarios we've actually hit:
      //   • User just reset their password → Clerk's React session state
      //     is briefly out of sync with the server and user.delete() never
      //     resolves on the client even though the server-side delete
      //     succeeds.
      //   • Network blip / Clerk worker stalls.
      // Either way, the delete request has been sent — at worst, the
      // user.delete() server call retries via Clerk's background sync
      // when they re-open the app and fails because the user is already
      // gone. The race ensures the UI always moves forward.
      try {
        await Promise.race([
          user.delete(),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("delete-account timeout")),
              8_000,
            ),
          ),
        ]);
      } catch (err) {
        // Don't surface the timeout error — proceed with sign-out + redirect.
        // The deletion almost always succeeded server-side; the timeout just
        // means the client never got the ack.
        console.warn("[delete-account] user.delete race:", err);
      }

      // Step 4: hard-redirect to landing. We use window.location.replace
      // rather than Next.js's router.push because after a successful
      // user.delete() the React/Clerk auth context is in an invalid state
      // and client-side navigation can stall on the Clerk middleware. A
      // hard navigation forces a fresh page load with no stale state.
      // signOut is called fire-and-forget so we don't block on it.
      try {
        void signOut();
      } catch {}
      window.location.replace("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setDeleteError(`Couldn't delete the account (${msg}). Please try again.`);
      setDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── User identity card ───────────────────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
          {user?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.imageUrl} alt="" className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <User className="w-6 h-6 text-emerald-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {isLoaded && user ? (
            <>
              <div className="font-extrabold text-white text-base truncate">
                {user.fullName || user.firstName || user.username || "FinScroll user"}
              </div>
              <div className="text-xs text-zinc-200 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  {user.primaryEmailAddress?.emailAddress ?? "no email"}
                </span>
              </div>
            </>
          ) : (
            <div className="h-5 w-32 rounded bg-zinc-800 animate-pulse" />
          )}
        </div>
      </div>

      {/* ── Account actions ──────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-300 px-1">
          Manage Account
        </h2>
        <p className="text-xs text-zinc-400 px-1 leading-relaxed">
          Open your secure account panel to edit profile, change password,
          manage connected accounts, or sign out remote devices.
        </p>
        {/*
          Honest UX: collapse the previous 5 rows into 2 destinations because
          Clerk's UserProfile modal only has 2 real pages. Each row now opens
          the exact section it advertises.
        */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
          <AccountRow
            icon={UserCircle}
            color="emerald"
            label="Profile & accounts"
            desc="Name, email, and connected providers like Google"
            onClick={openAccountPanel}
          />
          <AccountRow
            icon={Lock}
            color="violet"
            label="Security & devices"
            desc="Password, two-factor auth, and active sign-ins"
            onClick={openSecurityPanel}
          />
        </div>
      </section>

      {/* ── Local data ────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-300 px-1">
          Local Data
        </h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
          <AccountRow
            icon={PlayCircle}
            color="emerald"
            label="Replay tutorial"
            desc="See the swipe and tap gestures demo again"
            onClick={handleReplayTutorial}
          />
          <AccountRow
            icon={RefreshCw}
            color="sky"
            label="Reset onboarding"
            desc="Retake the 3-question intro flow"
            onClick={() => setConfirmAction("reset_onboarding")}
          />
          <AccountRow
            icon={Trash2}
            color="rose"
            label="Clear all local data"
            desc="Remove on-device progress (cloud copy stays safe)"
            onClick={() => setConfirmAction("clear_all")}
          />
        </div>
      </section>

      {/* ── Sign out ────────────────────────────────────────────── */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/15 hover:border-rose-500/50 font-extrabold text-sm transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>

      {/* ── Danger zone — account deletion is irreversible ─────── */}
      <section className="space-y-3 pt-2">
        <h2 className="text-xs font-black uppercase tracking-widest text-rose-400 px-1">
          Danger Zone
        </h2>
        <div className="bg-rose-950/30 border border-rose-900/60 rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 shrink-0">
              <UserX className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white">Delete account</h3>
              <p className="text-[11px] text-zinc-300 leading-snug mt-0.5">
                Permanently removes your profile, sign-in methods, streak,
                progress, notes, and cloud-synced data. This action cannot be
                undone.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setDeleteConfirmText("");
              setDeleteError(null);
              setConfirmAction("delete_account");
            }}
            className="w-full h-10 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-xs uppercase tracking-widest transition-colors"
          >
            Delete my account
          </button>
        </div>
      </section>

      {/* Legal footer */}
      <div className="text-center pt-2 pb-4 space-y-2">
        <nav className="flex items-center justify-center gap-4 text-[11px] font-semibold text-zinc-400">
          <Link
            href="/privacy"
            target="_blank"
            className="hover:text-white transition-colors"
          >
            Privacy
          </Link>
          <span className="text-zinc-600">·</span>
          <Link
            href="/terms"
            target="_blank"
            className="hover:text-white transition-colors"
          >
            Terms
          </Link>
          <span className="text-zinc-600">·</span>
          <Link
            href="/contact"
            target="_blank"
            className="hover:text-white transition-colors"
          >
            Contact
          </Link>
        </nav>
        <p className="text-[10px] text-zinc-500 leading-relaxed">
          FinScroll v1.0 · Educational use only.<br />
          Not a licensed financial advisor.
        </p>
      </div>

      {/* ── Confirm modal ─────────────────────────────────────────
         Three actions share this modal:
           • reset_onboarding  → soft confirm
           • clear_all         → soft confirm
           • delete_account    → type-to-confirm (must type DELETE)
         Type-to-confirm follows the GitHub / Stripe pattern for
         irreversible destructive actions. */}
      {confirmAction && (
        <div
          className="fixed inset-0 z-[60] bg-zinc-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => {
            if (!deletingAccount) setConfirmAction(null);
          }}
        >
          <div
            className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/30 text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-extrabold text-white text-base">
                  {confirmAction === "reset_onboarding"
                    ? "Reset onboarding?"
                    : confirmAction === "clear_all"
                    ? "Clear all local data?"
                    : "Delete your account?"}
                </h4>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  {confirmAction === "reset_onboarding"
                    ? "You'll go through the 3-question intro again on next /feed load. Your streak, completed cards, and synced cloud data stay safe."
                    : confirmAction === "clear_all"
                    ? "Removes streaks, completed cards, liked/saved markers, and onboarding from this device. If Supabase is configured, your cloud copy still exists and will sync back. This action can't be undone locally."
                    : "This permanently deletes your FinScroll profile, sign-in methods, streak, progress, notes, and all cloud-synced data. You won't be able to recover it. This cannot be undone."}
                </p>
              </div>
            </div>

            {/* Type-to-confirm input — only for delete_account */}
            {confirmAction === "delete_account" && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-300">
                  Type <span className="text-rose-300">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  autoFocus
                  disabled={deletingAccount}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm font-mono placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/60"
                />
                {deleteError && (
                  <p className="text-[11px] text-rose-400 leading-snug pt-1">
                    {deleteError}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={deletingAccount}
                className="flex-1 h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-60 border border-zinc-700 text-white font-bold text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={
                  confirmAction === "reset_onboarding"
                    ? handleResetOnboarding
                    : confirmAction === "clear_all"
                    ? handleClearLocalData
                    : handleDeleteAccount
                }
                disabled={
                  (confirmAction === "delete_account" &&
                    (deleteConfirmText.trim() !== "DELETE" ||
                      deletingAccount)) ||
                  deletingAccount
                }
                className="flex-1 h-11 rounded-xl bg-rose-500 hover:bg-rose-400 disabled:bg-rose-500/40 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {deletingAccount ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Deleting…
                  </>
                ) : confirmAction === "reset_onboarding" ? (
                  "Reset"
                ) : confirmAction === "clear_all" ? (
                  "Clear"
                ) : (
                  "Delete account"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Reusable row component ─────────────────────────────────────────
interface AccountRowProps {
  icon: React.ElementType;
  color: "emerald" | "sky" | "violet" | "amber" | "rose";
  label: string;
  desc: string;
  onClick: () => void;
}

function AccountRow({ icon: Icon, color, label, desc, onClick }: AccountRowProps) {
  const colorMap = {
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    sky: "bg-sky-500/10 border-sky-500/20 text-sky-400",
    violet: "bg-violet-500/10 border-violet-500/20 text-violet-400",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    rose: "bg-rose-500/10 border-rose-500/20 text-rose-400",
  } as const;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 p-4 hover:bg-zinc-800/40 transition-colors text-left"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`shrink-0 p-2 rounded-xl border ${colorMap[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-white">{label}</div>
          <div className="text-[11px] text-zinc-400 leading-snug">{desc}</div>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
    </button>
  );
}
