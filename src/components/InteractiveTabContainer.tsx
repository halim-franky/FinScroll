"use client";

import { useState } from "react";
import { Smartphone, Calculator, MessageSquare, Flame, BarChart3, Layers, Activity, TrendingUp, Sparkles, Settings } from "lucide-react";
import { FinTokFeed } from "./FinTokFeed";
import { OpportunityCalculator } from "./OpportunityCalculator";
import { ChatInterface } from "./ChatInterface";
import { InformationCenter } from "./InformationCenter";
import { FinfluencerRoast } from "./FinfluencerRoast";
import { WealthStreak } from "./WealthStreak";

interface DashboardMetrics {
  totalVectors: number;
  dimension: number;
  indexFullness: number;
  status: "Online" | "Offline" | "Error";
}

interface InteractiveTabContainerProps {
  metrics: DashboardMetrics;
}

type TabId = "fintok" | "calculator" | "roast" | "chat" | "engine";

export function InteractiveTabContainer({ metrics }: InteractiveTabContainerProps) {
  const [activeTab, setActiveTab] = useState<TabId>("fintok");

  const tabs = [
    { id: "fintok" as const, label: "Learn", icon: Smartphone },
    { id: "roast" as const, label: "Roast Mode", icon: Flame },
    { id: "calculator" as const, label: "Calculate", icon: Calculator },
    { id: "chat" as const, label: "AI Chat", icon: MessageSquare },
  ];

  return (
    <div className="space-y-6 flex flex-col justify-between min-h-[680px]">

      {/* Wealth Streak & Progress Dashboard */}
      <WealthStreak />
      
      <div className="space-y-6 flex-1">
        {/* Sticky Top Tab-Nav Bar */}
        <div className="sticky top-4 z-40 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/80 p-2 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
          
          {/* Left Side */}
          <div className="flex items-center gap-3 pl-2">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
            <span className="text-[10px] font-black tracking-wider uppercase text-zinc-400">
              FinScroll
            </span>
          </div>

          {/* Tab Controls */}
          <nav className="flex bg-zinc-900/80 border border-zinc-800/50 p-1 rounded-xl w-full md:w-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-black tracking-wide transition-all duration-300 ${
                    isActive
                      ? "bg-zinc-800 text-zinc-100 shadow-md border border-zinc-700/80"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? tab.id === "roast" ? "text-rose-400" : "text-emerald-400" : "text-zinc-600"}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Side */}
          <div className="hidden lg:flex items-center gap-2 pr-2 text-[9px] uppercase font-bold text-zinc-600">
            SEC / Springer Grounded
          </div>
        </div>

        {/* Tab Panel Content */}
        <div className="transition-all duration-500 ease-in-out">
          
          {/* VIEW 1: FINTOK */}
          {activeTab === "fintok" && (
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start w-full animate-fadeIn">
              {/* Left: Phone Feed */}
              <div className="xl:col-span-2 flex justify-center w-full">
                <FinTokFeed />
              </div>

              {/* Right: Contextual Guide */}
              <div className="xl:col-span-3 space-y-5 w-full">
                <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-zinc-100 text-lg">How FinTok Works</h3>
                      <p className="text-[10px] text-zinc-500">Replace doomscrolling with wealth-building micro-lessons</p>
                    </div>
                  </div>
                  <ul className="space-y-3 text-xs text-zinc-300">
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 mt-0.5 font-bold">1.</span>
                      <span><strong>Scroll vertically</strong> inside the phone viewport to progress through bite-sized financial concepts.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 mt-0.5 font-bold">2.</span>
                      <span>Tap the <strong>🧠 Knowledge Quiz</strong> button on each card to test what you learned.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 mt-0.5 font-bold">3.</span>
                      <span>Correct answers fill your <strong>Wealth Jar</strong> and extend your <strong>Learning Streak</strong>!</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 mt-0.5 font-bold">4.</span>
                      <span>Expand the <strong>source citation</strong> on any card to see the exact journal, year, and DOI.</span>
                    </li>
                  </ul>
                </div>

                {/* Finfluencer vs Science teaser */}
                <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <h4 className="text-sm font-black text-zinc-200 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-400" /> Did you know?
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                      <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Finfluencer</span>
                      <p className="text-[11px] text-rose-300 font-bold mt-1">&quot;Day trading is the fastest path to financial freedom&quot;</p>
                    </div>
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                      <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Science</span>
                      <p className="text-[11px] text-emerald-200 mt-1">SEC data: 95% of day traders lose money over any 3-year period.</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab("roast")} className="text-[10px] text-rose-400 font-bold hover:text-rose-300 transition-colors flex items-center gap-1">
                    <Flame className="w-3 h-3" /> Try Roast Mode to debunk more claims →
                  </button>
                </div>

                {/* Tip */}
                <div className="p-4 bg-emerald-950/15 border border-emerald-500/10 rounded-xl flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">Pro Tip 💡</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      After mastering all 4 concepts, switch to the <strong>&quot;Calculate&quot;</strong> tab to see how your redirected scroll hours compound into real wealth over 10–30 years!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: ROAST MODE */}
          {activeTab === "roast" && (
            <div className="animate-fadeIn">
              <div className="mb-6 text-center">
                <h3 className="text-2xl font-black text-zinc-100 flex items-center justify-center gap-2">
                  🔥 Finfluencer Roast Mode
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-lg mx-auto">
                  Paste any viral TikTok financial claim. Our AI will roast it in Gen-Z tone while citing actual SEC and Springer research that debunks it.
                </p>
              </div>
              <FinfluencerRoast />
            </div>
          )}

          {/* VIEW 3: CALCULATOR */}
          {activeTab === "calculator" && (
            <div className="animate-fadeIn w-full">
              <div className="mb-6">
                <h3 className="text-2xl font-black text-zinc-100 flex items-center gap-2">
                  🧮 Opportunity Cost Calculator
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Estimate how much passive wealth you accumulate by redirecting idle scroll hours into growth vehicles!
                </p>
              </div>
              <OpportunityCalculator />
            </div>
          )}

          {/* VIEW 4: AI CHAT */}
          {activeTab === "chat" && (
            <div className="animate-fadeIn w-full">
              <div className="mb-6">
                <h3 className="text-2xl font-black text-zinc-100 flex items-center gap-2">
                  💬 Grounded AI FinLit Companion
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Ask anything about finance. Every response is strictly grounded in SEC publications and Springer Nature Journals.
                </p>
              </div>
              <ChatInterface />
            </div>
          )}

          {/* VIEW 5: ENGINE AUDIT (hidden from nav) */}
          {activeTab === "engine" && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h3 className="text-2xl font-black text-zinc-100 flex items-center gap-2">
                  🛠️ Grounding & Engineering Audit Panel
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Backend Vector DB metrics, sync schedules, and indexing activity.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col gap-4">
                  <div className="flex items-center gap-3 text-zinc-400">
                    <Layers className="w-5 h-5 text-sky-400" />
                    <h2 className="font-bold text-zinc-200 tracking-wide uppercase text-[11px]">Grounded Facts</h2>
                  </div>
                  <div className="text-4xl font-black tracking-tighter text-zinc-50">{metrics.totalVectors.toLocaleString()}</div>
                  <div className="text-xs text-zinc-500">Data points vectorized in Pinecone</div>
                </div>
                <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col gap-4">
                  <div className="flex items-center gap-3 text-zinc-400">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <h2 className="font-bold text-zinc-200 tracking-wide uppercase text-[11px]">Target Yield</h2>
                  </div>
                  <div className="text-4xl font-black tracking-tighter text-zinc-50">8.00<span className="text-2xl text-zinc-500 font-medium ml-1">%</span></div>
                  <div className="text-xs text-zinc-500">Historical compound baseline</div>
                </div>
                <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col gap-4">
                  <div className="flex items-center gap-3 text-zinc-400">
                    <BarChart3 className="w-5 h-5 text-indigo-400" />
                    <h2 className="font-bold text-zinc-200 tracking-wide uppercase text-[11px]">Vector Size</h2>
                  </div>
                  <div className="text-4xl font-black tracking-tighter text-zinc-50">{metrics.dimension}</div>
                  <div className="text-xs text-zinc-500">Embedding dimensions for Gemini</div>
                </div>
              </div>
              <InformationCenter />
              <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800/80">
                <h3 className="text-sm font-bold text-zinc-300 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-zinc-500" /> Recent Ingestion Activity
                </h3>
                <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-950/50">
                  <p className="text-xs text-zinc-500">Awaiting new data ingestion payloads...</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-800/40 pt-6 mt-12 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-zinc-500 shrink-0">
        <div>© {new Date().getFullYear()} FinScroll. Empowering youth financial literacy.</div>
        <button 
          onClick={() => setActiveTab("engine")}
          className={`hover:text-zinc-300 transition-colors flex items-center gap-1.5 ${activeTab === "engine" ? "text-emerald-400 font-bold" : ""}`}
        >
          <Settings className="w-3.5 h-3.5" /> Developer Auditing Dashboard
        </button>
      </footer>
    </div>
  );
}
