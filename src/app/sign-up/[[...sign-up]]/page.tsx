import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Sparkles, Flame, Calculator } from "lucide-react";

const clerkAppearance = {
  variables: {
    colorPrimary: "#10b981",
    colorBackground: "#27272a",
    colorText: "#ffffff",
    colorTextSecondary: "#d4d4d8",
    colorNeutral: "#d4d4d8",
    colorInputBackground: "#3f3f46",
    colorInputText: "#ffffff",
    colorAlphaShade: "#ffffff",
    borderRadius: "0.75rem",
    fontFamily: "inherit",
    fontSize: "15px",
  },
  elements: {
    card: "bg-zinc-800 border border-zinc-700 shadow-2xl rounded-2xl",
    headerTitle: { color: "#ffffff", fontWeight: "700", fontSize: "1.125rem" },
    headerSubtitle: { color: "#d4d4d8", fontSize: "0.875rem" },
    socialButtonsBlockButton: "bg-zinc-700 border border-zinc-600 hover:bg-zinc-600 rounded-xl",
    socialButtonsBlockButtonText: { color: "#ffffff", fontWeight: "500" },
    dividerLine: { backgroundColor: "#52525b" },
    dividerText: { color: "#a1a1aa", fontSize: "0.75rem" },
    formFieldLabel: { color: "#e4e4e7", fontWeight: "600", fontSize: "0.875rem" },
    formFieldInput: "bg-zinc-700 border border-zinc-600 text-white placeholder:text-zinc-400 rounded-xl",
    formButtonPrimary: "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl",
    footerActionText: { color: "#a1a1aa", fontSize: "0.875rem" },
    footerActionLink: { color: "#34d399", fontWeight: "700" },
    identityPreviewText: { color: "#ffffff" },
    formFieldSuccessText: { color: "#34d399" },
    formFieldErrorText: { color: "#f87171" },
    alertText: { color: "#e4e4e7" },
    formFieldInputShowPasswordButton: { color: "#a1a1aa" },
    footer: { backgroundColor: "transparent" },
  },
};

const perks = [
  { icon: Flame, text: "Roast finfluencer myths with AI" },
  { icon: Sparkles, text: "Learn finance through TikTok-style cards" },
  { icon: Calculator, text: "See your real scroll opportunity cost" },
];

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <div className="flex items-center justify-center pt-10 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <span className="text-emerald-400 font-black text-base">F</span>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-zinc-50">FinScroll</span>
        </div>
      </div>

      <div className="text-center px-6 mb-6">
        <h1 className="text-2xl font-black text-zinc-50 tracking-tight">Start for free</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Turn your scroll habit into your greatest financial asset.
        </p>
      </div>

      <div className="flex flex-col gap-2 px-6 mb-6 max-w-sm mx-auto w-full">
        {perks.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2.5 px-3 py-2 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
            <Icon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-xs text-zinc-300 font-medium">{text}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-center px-4">
        <div className="w-full max-w-sm">
          <SignUp appearance={clerkAppearance} forceRedirectUrl="/feed" />
          <p className="text-center mt-4 text-sm text-zinc-400">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
