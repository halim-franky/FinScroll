"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  LogOut, RefreshCw, Trash2, Mail, User, AlertTriangle,
  Lock, Link2, Smartphone, ChevronRight, IdCard,
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
  const [confirmAction, setConfirmAction] =
    useState<null | "reset_onboarding" | "clear_all">(null);

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

  const openProfile = () => openUserProfile();

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
          Open your secure account panel to edit profile, change password, manage
          connected accounts, or sign out remote devices.
        </p>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
          <AccountRow
            icon={IdCard}
            color="emerald"
            label="Edit profile"
            desc="Name, profile picture, username"
            onClick={openProfile}
          />
          <AccountRow
            icon={Mail}
            color="sky"
            label="Email addresses"
            desc="Add or change your sign-in email"
            onClick={openProfile}
          />
          <AccountRow
            icon={Lock}
            color="violet"
            label="Password & security"
            desc="Change password and two-factor authentication"
            onClick={openProfile}
          />
          <AccountRow
            icon={Link2}
            color="amber"
            label="Connected accounts"
            desc="Google, GitHub, and other providers"
            onClick={openProfile}
          />
          <AccountRow
            icon={Smartphone}
            color="rose"
            label="Active devices"
            desc="See where you're signed in"
            onClick={openProfile}
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

      <p className="text-center text-[10px] text-zinc-500 leading-relaxed pt-2 pb-4">
        FinScroll v1.0 · Educational use only.<br />
        Not a licensed financial advisor.
      </p>

      {/* ── Confirm modal ───────────────────────────────────────── */}
      {confirmAction && (
        <div
          className="fixed inset-0 z-[60] bg-zinc-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setConfirmAction(null)}
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
                    : "Clear all local data?"}
                </h4>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  {confirmAction === "reset_onboarding"
                    ? "You'll go through the 3-question intro again on next /feed load. Your streak, completed cards, and synced cloud data stay safe."
                    : "Removes streaks, completed cards, liked/saved markers, and onboarding from this device. If Supabase is configured, your cloud copy still exists and will sync back. This action can't be undone locally."}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-bold text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={
                  confirmAction === "reset_onboarding"
                    ? handleResetOnboarding
                    : handleClearLocalData
                }
                className="flex-1 h-11 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-sm transition-colors"
              >
                {confirmAction === "reset_onboarding" ? "Reset" : "Clear"}
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
