"use client";

import { useState } from "react";
import { Flame, Send, Loader2, ShieldAlert, BookOpen, Sparkles, AlertTriangle, ExternalLink, Zap } from "lucide-react";

interface RoastResult {
  id: string;
  claim: string;
  roast: string;
  sources?: string[];
}

export function FinfluencerRoast() {
  const [claim, setClaim] = useState("");
  const [results, setResults] = useState<RoastResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Pre-built viral debunk cards: "What a Finfluencer Says vs. What Science Says"
  const debunkCards = [
    {
      finfluencer: "\"Crypto will 10x by end of year, trust me bro\" 🚀",
      science: "Springer research shows 88% of retail crypto traders lose money. Historical 10x predictions have a <3% accuracy rate across all speculative assets.",
      source: "Springer — Review of Financial Studies (2024)",
    },
    {
      finfluencer: "\"Day trading is the fastest way to financial freedom\" 💰",
      science: "SEC data confirms 95% of day traders lose money over any 3-year period. Transaction costs and behavioral biases systematically erode retail accounts.",
      source: "SEC Investor.gov & Barber & Odean (2000)",
    },
    {
      finfluencer: "\"You NEED to buy this options play before it expires\" ⏰",
      science: "Over 77% of options contracts expire worthless. Retail option buyers face a negative expected value due to bid-ask spreads and time decay (theta).",
      source: "Elsevier — Journal of Financial Economics (2023)",
    },
  ];

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
          message: `ROAST MODE: A TikTok finfluencer just claimed: "${userClaim}". Roast this claim in a sassy, witty Gen-Z tone while citing the actual SEC or Springer Nature research that debunks it. Be funny but factual. End with the specific grounded source that disproves it.`
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Roast failed");

      setResults(prev => [{
        id: Date.now().toString(),
        claim: userClaim,
        roast: data.data.reply,
        sources: data.data.sources
      }, ...prev]);
    } catch (err: any) {
      setResults(prev => [{
        id: Date.now().toString(),
        claim: userClaim,
        roast: `Couldn't roast this one right now — my brain is overheating 🔥 (${err.message})`,
      }, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 w-full">

      {/* Finfluencer vs Science Split-Screen Cards */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <h4 className="text-sm font-black text-zinc-200 uppercase tracking-wider">Finfluencer Myth vs. Actual Science</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {debunkCards.map((card, i) => (
            <div key={i} className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/80 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
              {/* Finfluencer side */}
              <div className="p-4 bg-rose-500/5 border-b border-rose-500/10">
                <div className="flex items-center gap-1.5 mb-2">
                  <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                  <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Finfluencer Says</span>
                </div>
                <p className="text-xs text-rose-300 font-bold leading-relaxed">{card.finfluencer}</p>
              </div>
              {/* Science side */}
              <div className="p-4 bg-emerald-500/5">
                <div className="flex items-center gap-1.5 mb-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Science Says</span>
                </div>
                <p className="text-[11px] text-emerald-200 leading-relaxed">{card.science}</p>
                <div className="flex items-center gap-1 mt-2 text-[9px] text-sky-400 font-bold">
                  <ExternalLink className="w-2.5 h-2.5" /> {card.source}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Roast Input */}
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-zinc-100 text-base">AI Finfluencer Roast Mode 🔥</h4>
            <p className="text-[10px] text-zinc-500">Paste any viral financial claim and our AI will roast it with grounded SEC / Springer citations.</p>
          </div>
        </div>

        <form onSubmit={handleRoast} className="relative flex items-center gap-2">
          <input
            type="text"
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            placeholder={`e.g. "This altcoin will make you rich in 30 days"`}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-4 pr-4 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !claim.trim()}
            className="px-5 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shrink-0"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4" /> Roast</>}
          </button>
        </form>

        {/* Quick-paste suggestions */}
        <div className="flex flex-wrap gap-2">
          {[
            "Dogecoin will hit $10 this year",
            "You need leverage to build real wealth",
            "Just copy my trades and you'll be rich"
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setClaim(suggestion)}
              className="text-[10px] px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all"
            >
              "{suggestion}"
            </button>
          ))}
        </div>
      </div>

      {/* Roast Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((r) => (
            <div key={r.id} className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3 shadow-lg">
              <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                <span className="text-[9px] text-rose-400 font-black uppercase tracking-widest">🎤 Finfluencer Claim</span>
                <p className="text-xs text-rose-300 font-bold mt-1">"{r.claim}"</p>
              </div>
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-1"><Sparkles className="w-3 h-3" /> FinScroll Roast</span>
                <p className="text-sm text-zinc-200 mt-1 whitespace-pre-wrap leading-relaxed">{r.roast}</p>
              </div>
              {r.sources && r.sources.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {r.sources.map((s, i) => (
                    <span key={i} className="text-[9px] px-2 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 font-bold flex items-center gap-1">
                      <BookOpen className="w-2.5 h-2.5" /> {s.startsWith("http") ? new URL(s).hostname.replace("www.", "") : s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
