"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk, UserProfile } from "@clerk/nextjs";
import {
  ChevronLeft, LogOut, RefreshCw, Trash2, Mail, User, AlertTriangle,
} from "lucide-react";

const clerkProfileAppearance = {
  variables: {
    colorPrimary: "#10b981",
    colorBackground: "#18181b",
    colorText: "#ffffff",
    colorTextSecondary: "#d4d4d8",
    colorNeutral: "#d4d4d8",
    colorInputBackground: "#27272a",
    colorInputText: "#ffffff",
    colorAlphaShade: "#ffffff",
    borderRadius: "0.75rem",
    fontFamily: "inherit",
    fontSize: "14px",
  },
  elements: {
    rootBox: "w-full",
    card: "bg-zinc-900 border border-zinc-800 shadow-none rounded-2xl",
    navbar: "bg-zinc-900 border-zinc-800",
    navbarButton: { color: "#d4d4d8" },
    navbarButtonText: { color: "#d4d4d8" },
    headerTitle: { color: "#ffffff", fontWeight: "700" },
    headerSubtitle: { color: "#a1a1aa" },
    profileSectionTitleText: { color: "#fafafa", fontWeight: "700" },
    profileSectionContent: { color: "#d4d4d8" },
    profileSection__danger: { borderColor: "rgba(244,63,94,0.2)" },
    formFieldLabel: { color: "#e4e4e7", fontWeight: "600" },
    formFieldInput:
      "bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-400 rounded-xl",
    formButtonPrimary:
      "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl",
    formButtonReset: { color: "#a1a1aa" },
    accordionTriggerButton: { color: "#fafafa" },
    badge: { backgroundColor: "rgba(16,185,129,0.15)", color: "#34d399" },
    formFieldSuccessText: { color: "#34d399" },
    formFieldErrorText: { color: "#f87171" },
    alertText: { color: "#e4e4e7" },
    footer: { backgroundColor: "transparent" },
  },
};

interface Props {
  userId: string;
}

export function SettingsView({ userId }: Props) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [confirmAction, setConfirmAction] = useState<null | "reset_onboarding" | "clear_all">(null);

  const handleSignOut = async () => {
    try {
      await signOut({ redirectUrl: "/" });
    } catch {
      router.push("/");
    }
  };

  const handleResetOnboarding = () => {
    try {
      localStorage.removeItem(`finscroll_onboarding_${userId}`);
    } catch {}
    setConfirmAction(null);
    router.push("/feed");
  };

  const handleClearLocalData = () => {
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

  return (
    <div className="space-y-5">

      {/* Header strip with back nav */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => router.push("/stats")}
          className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors text-sm font-bold"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
          v1.0
        </span>
      </div>

      {/* User identity card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
          {user?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.imageUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-emerald-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {isLoaded && user ? (
            <>
              <div className="font-extrabold text-zinc-50 text-base truncate">
                {user.fullName || user.firstName || user.username || "FinScroll user"}
              </div>
              <div className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3 h-3" />
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

      {/* Clerk-managed account: password, email, sessions, delete */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-3 px-1">
          Manage Account
        </h3>
        <p className="text-xs text-zinc-500 mb-4 px-1 leading-relaxed">
          Update your email, change password, manage connected accounts, or sign out remote devices.
        </p>
        <UserProfile appearance={clerkProfileAppearance} routing="hash" />
      </div>

      {/* Local data section */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-3 px-1">
          Local Data
        </h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl divide-y divide-zinc-800">
          <button
            onClick={() => setConfirmAction("reset_onboarding")}
            className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-zinc-100">Reset onboarding</div>
                <div className="text-[11px] text-zinc-500">Retake the 3-question intro flow</div>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-zinc-600 rotate-180" />
          </button>
          <button
            onClick={() => setConfirmAction("clear_all")}
            className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-zinc-100">Clear local data</div>
                <div className="text-[11px] text-zinc-500">Remove all on-device progress (cloud copy stays safe)</div>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-zinc-600 rotate-180" />
          </button>
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/15 hover:border-rose-500/50 font-extrabold text-sm transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>

      <p className="text-center text-[10px] text-zinc-600 leading-relaxed pt-2 pb-4">
        FinScroll v1.0 · Educational use only.<br />
        Not a licensed financial advisor.
      </p>

      {/* Confirm modal */}
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
                <h4 className="font-extrabold text-zinc-50 text-base">
                  {confirmAction === "reset_onboarding"
                    ? "Reset onboarding?"
                    : "Clear all local data?"}
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {confirmAction === "reset_onboarding"
                    ? "You'll go through the 3-question intro again on next /feed load. Your streak, completed cards, and synced cloud data stay safe."
                    : "Removes streaks, completed cards, liked/saved markers, and onboarding from this device. If Supabase is configured, your cloud copy still exists and will sync back. This action can't be undone locally."}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-bold text-sm transition-colors"
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
