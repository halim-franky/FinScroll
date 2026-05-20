"use client";

import { useState, useEffect } from "react";
import { Flame, Trophy, Calendar, TrendingUp, DollarSign, Clock } from "lucide-react";

export function WealthStreak() {
  const [streak, setStreak] = useState(0);
  const [completedCards, setCompletedCards] = useState(0);
  const [todayScrollMinutes, setTodayScrollMinutes] = useState(0);

  useEffect(() => {
    try {
      const s = localStorage.getItem("finscroll_streak");
      if (s) setStreak(parseInt(s, 10));
      const c = localStorage.getItem("finscroll_completed");
      if (c) setCompletedCards(Object.values(JSON.parse(c)).filter(Boolean).length);
      // Simulate today's scroll estimate from session
      const sessionStart = localStorage.getItem("finscroll_session_start");
      if (!sessionStart) {
        localStorage.setItem("finscroll_session_start", Date.now().toString());
      } else {
        const elapsed = Math.floor((Date.now() - parseInt(sessionStart, 10)) / 60000);
        setTodayScrollMinutes(elapsed);
      }
    } catch {}

    // Update scroll timer every 30 seconds
    const interval = setInterval(() => {
      try {
        const sessionStart = localStorage.getItem("finscroll_session_start");
        if (sessionStart) {
          const elapsed = Math.floor((Date.now() - parseInt(sessionStart, 10)) / 60000);
          setTodayScrollMinutes(elapsed);
        }
      } catch {}
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const dailyScrollCost = ((todayScrollMinutes / 60) * 3 * 365 * 0.08).toFixed(0);
  const streakMilestones = [3, 7, 14, 30, 60, 100];
  const nextMilestone = streakMilestones.find(m => m > streak) || 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* Streak Card */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/20 text-orange-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-zinc-100 text-sm">Learning Streak</h4>
            <p className="text-[9px] text-zinc-500">Consecutive days learning</p>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-orange-400">{streak}</span>
          <span className="text-sm text-zinc-500 font-bold">days</span>
        </div>
        {/* Progress to next milestone */}
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] text-zinc-500">
            <span>Next milestone</span>
            <span className="text-orange-400 font-bold">{nextMilestone} days</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full transition-all duration-700" style={{ width: `${Math.min((streak / nextMilestone) * 100, 100)}%` }} />
          </div>
        </div>
        {/* Milestone badges */}
        <div className="flex gap-1.5 flex-wrap">
          {streakMilestones.map(m => (
            <div key={m} className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${streak >= m ? "bg-orange-500/20 border-orange-500/40 text-orange-300" : "bg-zinc-800 border-zinc-700 text-zinc-600"}`}>
              {m}d {streak >= m ? "✓" : ""}
            </div>
          ))}
        </div>
      </div>

      {/* Concepts Mastered */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-zinc-100 text-sm">Concepts Mastered</h4>
            <p className="text-[9px] text-zinc-500">Quiz-verified knowledge</p>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-emerald-400">{completedCards}</span>
          <span className="text-sm text-zinc-500 font-bold">/ 4</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700" style={{ width: `${(completedCards / 4) * 100}%` }} />
        </div>
        <p className="text-[10px] text-zinc-500">{completedCards >= 4 ? "🎉 All concepts mastered! You're financially grounded!" : `${4 - completedCards} more concept${4 - completedCards !== 1 ? "s" : ""} to master`}</p>
      </div>

      {/* Daily Scroll Cost Badge */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-zinc-100 text-sm">Today&apos;s Session</h4>
            <p className="text-[9px] text-zinc-500">Time spent on FinScroll</p>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-sky-400">{todayScrollMinutes}</span>
          <span className="text-sm text-zinc-500 font-bold">min</span>
        </div>
        <div className="p-2 bg-rose-500/5 border border-rose-500/10 rounded-lg">
          <p className="text-[9px] text-rose-300 font-bold">
            💸 Doomscrolling this time elsewhere would cost ~${dailyScrollCost}/yr in lost compound wealth
          </p>
        </div>
        <p className="text-[10px] text-emerald-400 font-bold">
          ✅ But you&apos;re learning here instead — smart move!
        </p>
      </div>
    </div>
  );
}
