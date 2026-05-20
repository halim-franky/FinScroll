"use client";

import { useState, useEffect } from "react";
import {
  DollarSign, Landmark, TrendingUp, Zap, Clock,
} from "lucide-react";
import { readOnboarding } from "./OnboardingModal";

const assets = [
  {
    label: "HYSA",
    fullName: "High-Yield Savings",
    rate: 0.04,
    hint: "Safe & steady — 4% APY",
    color: "text-sky-400",
    activeBg: "bg-sky-500/10 border-sky-500/40 text-sky-400",
  },
  {
    label: "S&P 500",
    fullName: "S&P 500 Index Fund",
    rate: 0.08,
    hint: "Historical avg — 8% APY",
    color: "text-emerald-400",
    activeBg: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400",
  },
  {
    label: "Tech Growth",
    fullName: "Tech Growth Portfolio",
    rate: 0.12,
    hint: "Aggressive — 12% APY",
    color: "text-violet-400",
    activeBg: "bg-violet-500/10 border-violet-500/40 text-violet-400",
  },
];

function compound(
  principal: number,
  monthlyPMT: number,
  annualRate: number,
  years: number
) {
  const n = 12;
  const r = annualRate / n;
  const t = n * years;
  const compPrincipal = principal * Math.pow(1 + r, t);
  if (r === 0) return compPrincipal + monthlyPMT * t;
  return compPrincipal + monthlyPMT * ((Math.pow(1 + r, t) - 1) / r);
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n).toLocaleString()}`;
  return `$${Math.round(n)}`;
}

interface SliderRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  hint: string;
  onChange: (v: number) => void;
}

function SliderRow({ icon: Icon, label, value, min, max, step, current, hint, onChange }: SliderRowProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="w-4 h-4 text-zinc-500 shrink-0" />
          <span className="text-sm font-semibold text-zinc-300 truncate">{label}</span>
        </div>
        <span className="text-sm font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-lg shrink-0 whitespace-nowrap">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
      />
      <p className="text-[11px] text-zinc-600 leading-relaxed">{hint}</p>
    </div>
  );
}

interface Props {
  userId?: string;
}

export function OpportunityCalculator({ userId = "guest" }: Props) {
  const [startingCapital, setStartingCapital] = useState(500);
  const [scrollHours, setScrollHours] = useState(4);
  const [hourlyValue, setHourlyValue] = useState(3);
  const [selectedAsset, setSelectedAsset] = useState(1);

  // Pre-fill from onboarding answer if available
  useEffect(() => {
    const onboarding = readOnboarding(userId);
    if (onboarding && !onboarding.skipped) {
      setScrollHours(onboarding.scrollHours);
    }
  }, [userId]);

  const asset = assets[selectedAsset];
  const dailySavings = scrollHours * hourlyValue;
  const monthly = dailySavings * 30.44;

  const val10 = compound(startingCapital, monthly, asset.rate, 10);
  const val30 = compound(startingCapital, monthly, asset.rate, 30);
  const invested10 = startingCapital + monthly * 12 * 10;
  const invested30 = startingCapital + monthly * 12 * 30;
  const gains10 = Math.max(0, val10 - invested10);
  const gains30 = Math.max(0, val30 - invested30);

  return (
    <div className="w-full space-y-5">

      {/* ── Section 1: Controls ─────────────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-6">
        <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest">
          Your Numbers
        </h3>

        <SliderRow
          icon={Landmark}
          label="Starting Capital"
          value={`$${startingCapital.toLocaleString()}`}
          min={0} max={5000} step={100}
          current={startingCapital}
          hint="How much you can invest today. Even $0 works — add it later."
          onChange={setStartingCapital}
        />

        <SliderRow
          icon={Clock}
          label="Daily Scroll Hours"
          value={`${scrollHours} hr / day`}
          min={1} max={12} step={1}
          current={scrollHours}
          hint="Gen-Z average: 4–7 hrs/day on social media."
          onChange={setScrollHours}
        />

        <SliderRow
          icon={DollarSign}
          label="Savings per Scroll Hour"
          value={`$${hourlyValue} / hr`}
          min={1} max={10} step={1}
          current={hourlyValue}
          hint="Skipped impulse buys, subscriptions, or food delivery per hour."
          onChange={setHourlyValue}
        />

        {/* Equation summary */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono">
          <span className="text-emerald-400 font-bold">{scrollHours} hr/day</span>
          <span className="text-zinc-600">×</span>
          <span className="text-emerald-400 font-bold">${hourlyValue}/hr</span>
          <span className="text-zinc-600">=</span>
          <span className="text-emerald-400 font-black text-sm">${dailySavings}/day</span>
          <span className="text-zinc-600">→</span>
          <span className="text-zinc-400 font-bold">${Math.round(monthly).toLocaleString()}/mo invested</span>
        </div>
      </div>

      {/* ── Section 2: Asset selector ───────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest">
          Where you invest it
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {assets.map((a, i) => (
            <button
              key={a.label}
              onClick={() => setSelectedAsset(i)}
              className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-center transition-all ${
                selectedAsset === i
                  ? a.activeBg
                  : "border-zinc-800 text-zinc-500 hover:border-zinc-700"
              }`}
            >
              <span className="text-xs font-black tracking-tight">{a.label}</span>
              <span className={`text-[9px] font-bold ${selectedAsset === i ? "" : "text-zinc-600"}`}>
                {a.hint}
              </span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-zinc-600">
          Currently projecting with <strong className="text-zinc-400">{asset.fullName}</strong> at{" "}
          <strong className="text-zinc-400">{asset.rate * 100}% annual return</strong>, compounded monthly.
        </p>
      </div>

      {/* ── Section 3: Results ──────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest px-1">
          Your compound projection
        </h3>

        {/* 10-year card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">10-Year Horizon</span>
              <div className="text-4xl font-black text-emerald-400 tracking-tight mt-1">
                {fmt(val10)}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                From ${startingCapital.toLocaleString()} start + ${Math.round(monthly).toLocaleString()}/mo
              </p>
            </div>
            <div className="shrink-0 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
              <div className="text-[8px] font-black text-emerald-400 uppercase tracking-wider">Return</div>
              <div className="text-sm font-black text-emerald-400">
                {invested10 > 0 ? `${Math.round((val10 / invested10 - 1) * 100)}%` : "—"}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800">
            <div className="space-y-0.5">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">You put in</p>
              <p className="text-sm font-bold text-zinc-300">{fmt(invested10)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">Market grows it by</p>
              <p className="text-sm font-bold text-emerald-400">+{fmt(gains10)}</p>
            </div>
          </div>
        </div>

        {/* 30-year card */}
        <div className="bg-zinc-900 border border-violet-500/20 rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">30-Year Horizon</span>
              <div className="text-4xl font-black text-violet-400 tracking-tight mt-1">
                {fmt(val30)}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Same habit, continued for 30 years
              </p>
            </div>
            <div className="shrink-0 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-xl text-center">
              <div className="text-[8px] font-black text-violet-400 uppercase tracking-wider">Return</div>
              <div className="text-sm font-black text-violet-400">
                {invested30 > 0 ? `${Math.round((val30 / invested30 - 1) * 100)}%` : "—"}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800">
            <div className="space-y-0.5">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">You put in</p>
              <p className="text-sm font-bold text-zinc-300">{fmt(invested30)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">Market grows it by</p>
              <p className="text-sm font-bold text-violet-400">+{fmt(gains30)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 4: Insight ──────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 bg-emerald-950/20 border border-emerald-500/15 rounded-2xl">
        <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0 mt-0.5">
          <Zap className="w-4 h-4" />
        </div>
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
            The Real Cost of Doomscrolling
          </p>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Redirecting <strong className="text-zinc-200">{scrollHours} hours/day</strong> of scrolling
            into <strong className="text-zinc-200">${dailySavings}/day</strong> savings builds{" "}
            <strong className="text-emerald-400">{fmt(val30)}</strong> over 30 years.
            That&apos;s the gap between retiring comfortably and working forever.
          </p>
        </div>
      </div>

    </div>
  );
}
