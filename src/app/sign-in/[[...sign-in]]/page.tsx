import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Shield, TrendingUp, BookOpen } from "lucide-react";

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

export default function SignInPage() {
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

      <div className="text-center px-6 mb-8">
        <h1 className="text-2xl font-black text-zinc-50 tracking-tight">Welcome back</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Keep your streak alive. Your wealth journey continues.
        </p>
      </div>

      <div className="flex justify-center px-4">
        <div className="w-full max-w-sm">
          <SignIn appearance={clerkAppearance} forceRedirectUrl="/feed" />
          <p className="text-center mt-4 text-sm text-zinc-400">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 mt-10 px-6 pb-10">
        {[
          { icon: Shield, label: "SEC-Grounded" },
          { icon: TrendingUp, label: "Science-Backed" },
          { icon: BookOpen, label: "Free to Learn" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <Icon className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] text-zinc-500 font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
