import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "FinScroll — You scrolled too far",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(244,63,94,0.08),transparent)] pointer-events-none" />

      {/* Logo */}
      <div className="relative flex items-center gap-2.5 mb-12">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <span className="text-emerald-400 font-black text-base">F</span>
        </div>
        <span className="text-xl font-extrabold tracking-tight text-zinc-50">FinScroll</span>
      </div>

      {/* Big 404 */}
      <h1 className="relative text-7xl sm:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-rose-400 to-orange-500 leading-none">
        404
      </h1>

      <h2 className="relative mt-6 text-2xl sm:text-3xl font-black tracking-tight text-zinc-50">
        You scrolled too far.
      </h2>

      <p className="relative mt-4 text-zinc-400 max-w-md text-sm sm:text-base leading-relaxed">
        This page doesn&apos;t exist — but the time you just spent looking for it
        cost you about <span className="text-rose-400 font-bold">$0.0003</span> in
        compound wealth. Let&apos;s get you back to learning.
      </p>

      <div className="relative mt-10 flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-sm rounded-2xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)]"
        >
          Back to FinTok
          <ChevronRight className="w-4 h-4" />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold text-sm rounded-2xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Landing page
        </Link>
      </div>

      <p className="relative mt-16 text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
        Error 404 — Doomscroll Detected
      </p>
    </div>
  );
}
