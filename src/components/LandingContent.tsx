"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp, Flame, Calculator, MessageCircle,
  Shield, Zap, ChevronRight, AlertTriangle,
} from "lucide-react";

function ScrollCostCounter() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const costPerSecond = 0.000134;
  const cost = (seconds * costPerSecond).toFixed(6);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="mt-8 inline-flex flex-col items-center gap-2 px-6 py-4 bg-zinc-900/80 border border-zinc-700/50 rounded-2xl backdrop-blur-sm">
      <div className="flex items-center gap-2 text-xs text-zinc-400 uppercase tracking-widest font-bold">
        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        Live on this page: {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </div>
      <div className="text-2xl font-black text-rose-400 tabular-nums">${cost}</div>
      <div className="text-[10px] text-zinc-500 text-center leading-relaxed">
        in compound wealth opportunity cost<br />at 8% annual return
      </div>
    </div>
  );
}

const features = [
  {
    icon: TrendingUp, color: "emerald", title: "FinTok Feed",
    description: "TikTok-style vertical scroll cards. Every fact is grounded in SEC publications and peer-reviewed research. Same format, zero speculation.",
  },
  {
    icon: Flame, color: "rose", title: "Finfluencer Roast",
    description: 'Paste any viral "get rich quick" claim. Our AI obliterates it with actual data, then explains the science behind why it\'s dangerous.',
  },
  {
    icon: Calculator, color: "sky", title: "Wealth Calculator",
    description: "Drag the slider to your daily scroll hours. Watch your 30-year compound loss materialize in real-time. The number will shock you.",
  },
  {
    icon: MessageCircle, color: "violet", title: "AI Finance Coach",
    description: "Powered by Google Gemini Flash. Every answer is grounded in Pinecone vector search over SEC and Springer Nature data. No hallucinations.",
  },
];

const stats = [
  { value: "6.5h", label: "avg daily scroll time, Gen-Z", color: "rose" },
  { value: "$127k", label: "compound wealth lost per person", color: "orange" },
  { value: "95%", label: "of day traders lose money (SEC)", color: "red" },
];

const poweredBy = [
  { name: "Google Gemini Flash", badge: "AI" },
  { name: "Pinecone Vector DB", badge: "RAG" },
  { name: "SEC Investor.gov", badge: "Data" },
  { name: "Springer Nature", badge: "Research" },
];

export function LandingContent() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <span className="text-emerald-400 text-xs font-black">F</span>
            </div>
            <span className="font-extrabold tracking-tight text-zinc-50">FinScroll</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors font-medium">
              Sign in
            </Link>
            <Link href="/sign-up" className="text-sm bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-4 py-2 rounded-xl transition-colors">
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.12),transparent)]" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center relative">
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-zinc-50 leading-none">
            <span className="block hero-reveal hero-reveal-1">Stop</span>
            <span className="block hero-reveal hero-reveal-2 text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-500">Doomscrolling.</span>
            <span className="block hero-reveal hero-reveal-3">Start</span>
            <span className="block hero-reveal hero-reveal-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Wealth-Building.</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed hero-reveal hero-reveal-5">
            The average Gen-Z spends <strong className="text-zinc-200">6.5 hours/day</strong> scrolling content that makes them poorer.
            FinScroll turns your worst habit into your most powerful financial education tool, using the{" "}
            <strong className="text-zinc-200">same addictive scroll mechanics</strong> that trap you, to set you free.
          </p>
          <div className="hero-reveal hero-reveal-5">
            <ScrollCostCounter />
          </div>
          <div className="mt-8 flex items-center justify-center hero-reveal hero-reveal-5">
            <Link
              href="/sign-up"
              className="flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-base rounded-2xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)]"
            >
              Start Learning Free
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-zinc-800/50 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center space-y-1">
              <div className={`text-4xl font-black tracking-tighter ${s.color === "rose" ? "text-rose-400" : s.color === "orange" ? "text-orange-400" : "text-red-400"}`}>
                {s.value}
              </div>
              <div className="text-xs text-zinc-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* The Problem */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <span className="text-xs font-black uppercase tracking-widest text-rose-400">The Problem</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-zinc-50 mb-4">
          Compound interest is undefeated.<br />
          <span className="text-rose-400">Right now, it&apos;s working against you.</span>
        </h2>
        <p className="text-zinc-400 max-w-2xl leading-relaxed mx-auto">
          You were never taught how money actually works. Inflation didn&apos;t wait. Wages didn&apos;t keep up.
          Every year you delay, compound interest works against you, not for you.
        </p>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Zap className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-black uppercase tracking-widest text-emerald-400">The Solution</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-zinc-50 mb-10">Four tools. One mission.</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map((f) => {
            const Icon = f.icon;
            const colors: Record<string, string> = {
              emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
              rose: "bg-rose-500/10 border-rose-500/20 text-rose-400",
              sky: "bg-sky-500/10 border-sky-500/20 text-sky-400",
              violet: "bg-violet-500/10 border-violet-500/20 text-violet-400",
            };
            return (
              <div key={f.title} className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-colors text-left space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${colors[f.color]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-zinc-100 text-base">{f.title}</h3>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-zinc-800/50 bg-zinc-900/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
          <h2 className="text-3xl font-black tracking-tighter text-zinc-50 mb-10 text-center">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Scroll & Learn", desc: "Swipe through bite-sized finance cards in the FinTok feed. Same format as TikTok, but every fact is SEC-verified." },
              { step: "2", title: "Quiz to Unlock", desc: "Answer the knowledge check on each card. Correct answers build your streak and advance your level." },
              { step: "3", title: "See Your Real Cost", desc: "The Opportunity Calculator shows exactly how much compound wealth your scroll hours are costing you over 30 years." },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-zinc-200 mb-1">{item.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Powered by */}
      <section className="border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <p className="text-xs text-zinc-600 uppercase font-bold tracking-widest text-center mb-8">Powered by</p>
          <div className="flex flex-wrap justify-center gap-4">
            {poweredBy.map((p) => (
              <div key={p.name} className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl">
                <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">{p.badge}</span>
                <span className="text-sm text-zinc-300 font-medium">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-zinc-800/50 bg-gradient-to-b from-zinc-900/30 to-zinc-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-24 text-center">
          <Shield className="w-8 h-8 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-zinc-50 mb-4">Ready to break free?</h2>
          <p className="text-zinc-400 mb-8 max-w-md mx-auto">
            Every minute you keep scrolling is money compounding against you. Start now — it takes 30 seconds.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-lg rounded-2xl transition-all shadow-[0_0_40px_rgba(16,185,129,0.35)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)]"
          >
            Start Learning Free
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
          <span>© {new Date().getFullYear()} FinScroll. Empowering Gen-Z financial literacy.</span>
          <span>Not a licensed financial advisor. Educational use only.</span>
        </div>
      </footer>
    </div>
  );
}
