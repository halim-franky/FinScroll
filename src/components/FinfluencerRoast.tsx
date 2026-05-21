"use client";

import { useState, useMemo } from "react";
import {
  Flame, Send, Loader2, ShieldAlert, BookOpen, Sparkles,
  ExternalLink, Zap, Filter,
} from "lucide-react";
import {
  MYTHS, CATEGORY_META, SEVERITY_META,
  type MythCategory,
} from "@/lib/myths";

interface RoastResult {
  id: string;
  claim: string;
  roast: string;
  sources?: string[];
}

type FilterValue = MythCategory | "all";

const FILTERS: { value: FilterValue; label: string; emoji: string }[] = [
  { value: "all",            label: "All",            emoji: "🔥" },
  { value: "crypto",         label: "Crypto",         emoji: "🪙" },
  { value: "daytrading",     label: "Day Trading",    emoji: "📈" },
  { value: "passive_income", label: "Passive Income", emoji: "💸" },
  { value: "market_timing",  label: "Market Timing",  emoji: "⏰" },
  { value: "speculation",    label: "Speculation",    emoji: "🎰" },
];

export function FinfluencerRoast() {
  const [filter, setFilter] = useState<FilterValue>("all");
  const [claim, setClaim] = useState("");
  const [results, setResults] = useState<RoastResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const filteredMyths = useMemo(() => {
    return filter === "all" ? MYTHS : MYTHS.filter((m) => m.category === filter);
  }, [filter]);

  const handleRoast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim.trim() || isLoading) return;

    const userClaim = claim.trim();
    setClaim("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `ROAST MODE: A TikTok finfluencer just claimed: "${userClaim}". Roast this claim in a sassy, witty Gen-Z tone while citing the actual SEC or Springer Nature research that debunks it. Be funny but factual. End with the specific grounded source that disproves it.`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Roast failed");

      setResults((prev) => [
        {
          id: Date.now().toString(),
          claim: userClaim,
          roast: data.data.reply,
          sources: data.data.sources,
        },
        ...prev,
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setResults((prev) => [
        {
          id: Date.now().toString(),
          claim: userClaim,
          roast: `Couldn't roast this one right now, my brain is overheating 🔥 (${msg})`,
        },
        ...prev,
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full">

      {/* AI Roast Input — pinned to top so it's discoverable */}
      <div className="p-5 bg-gradient-to-br from-rose-950/40 via-zinc-900 to-zinc-900 border border-rose-500/20 rounded-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/15 rounded-xl border border-rose-500/30 text-rose-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-zinc-100 text-base">Roast a Claim</h4>
            <p className="text-[10px] text-zinc-500">Paste any viral financial take. AI will obliterate it with citations.</p>
          </div>
        </div>

        <form onSubmit={handleRoast} className="flex items-center gap-2">
          <input
            type="text"
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            placeholder='e.g. "This coin will hit $1 next month"'
            maxLength={500}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !claim.trim()}
            className="px-4 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shrink-0"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4" /> Roast</>}
          </button>
        </form>

        {/* Quick-paste suggestions */}
        <div className="flex flex-wrap gap-2">
          {[
            "Dogecoin will hit $10 this year",
            "Copy my trades and get rich",
            "Real estate has no risk",
          ].map((s) => (
            <button
              key={s}
              onClick={() => setClaim(s)}
              className="text-[10px] px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all"
            >
              &ldquo;{s}&rdquo;
            </button>
          ))}
        </div>
      </div>

      {/* AI Roast Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((r) => (
            <div key={r.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
              <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                <span className="text-[9px] text-rose-400 font-black uppercase tracking-widest">🎤 The Claim</span>
                <p className="text-xs text-rose-300 font-bold mt-1">&ldquo;{r.claim}&rdquo;</p>
              </div>
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Roast
                </span>
                <p className="text-sm text-zinc-200 mt-1 whitespace-pre-wrap leading-relaxed">{r.roast}</p>
              </div>
              {r.sources && r.sources.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {r.sources.map((s, i) => (
                    <span key={i} className="text-[9px] px-2 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 font-bold flex items-center gap-1">
                      <BookOpen className="w-2.5 h-2.5" />
                      {s.startsWith("http") ? new URL(s).hostname.replace("www.", "") : s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Myth Library Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-zinc-200 uppercase tracking-wider">Myth Library</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {filteredMyths.length} science-backed debunks of viral finfluencer claims
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="text-[9px] uppercase tracking-wider font-bold">Filter</span>
          </div>
        </div>

        {/* Category filter pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${
                  active
                    ? "bg-rose-500/15 border-rose-500/40 text-rose-300"
                    : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                }`}
              >
                <span>{f.emoji}</span> {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Myth Cards */}
      <div className="space-y-4">
        {filteredMyths.map((myth) => {
          const sev = SEVERITY_META[myth.severity];
          const cat = CATEGORY_META[myth.category];
          return (
            <div
              key={myth.id}
              className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900 shadow-lg"
            >
              {/* Header strip: archetype + category + severity */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/60">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">{cat.emoji}</span>
                  <span className="text-[10px] font-bold text-zinc-400 truncate">{myth.archetype}</span>
                </div>
                <span className={`shrink-0 text-[8px] font-black px-2 py-0.5 rounded-full border ${sev.bg} ${sev.color}`}>
                  {sev.label}
                </span>
              </div>

              {/* Finfluencer claim */}
              <div className="p-4 bg-rose-500/5 border-b border-rose-500/10">
                <div className="flex items-center gap-1.5 mb-2">
                  <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                  <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">
                    They Say
                  </span>
                </div>
                <p className="text-sm text-rose-300 font-bold leading-relaxed">
                  &ldquo;{myth.claim}&rdquo;
                </p>
              </div>

              {/* Science debunk */}
              <div className="p-4 bg-emerald-500/5">
                <div className="flex items-center gap-1.5 mb-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                    Science Says
                  </span>
                </div>
                <p className="text-xs text-emerald-100 leading-relaxed">{myth.scienceSays}</p>

                {/* Key stat callout */}
                <div className="mt-3 p-2.5 bg-black/30 border border-emerald-500/10 rounded-xl">
                  <div className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">
                    The receipt
                  </div>
                  <div className="text-xs font-black text-emerald-300">{myth.keyStat}</div>
                </div>

                {/* Source */}
                <div className="flex items-center gap-1 mt-2.5 text-[9px] text-sky-400 font-bold">
                  <ExternalLink className="w-2.5 h-2.5" />
                  {myth.source}
                </div>
              </div>
            </div>
          );
        })}

        {filteredMyths.length === 0 && (
          <div className="text-center py-8 text-zinc-500 text-sm">
            No myths in this category yet.
          </div>
        )}
      </div>

      {/* Footer note */}
      <p className="text-center text-[10px] text-zinc-600 leading-relaxed pt-4">
        Every debunk is grounded in SEC publications or peer-reviewed academic research.<br />
        We don&apos;t roast people. We roast the claims that hurt them.
      </p>
    </div>
  );
}
