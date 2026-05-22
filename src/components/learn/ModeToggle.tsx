"use client";

import { Layers, BookOpen, BarChart3, Headphones } from "lucide-react";

export type LearnMode = "story" | "read" | "visualize" | "audio";

const MODES: { id: LearnMode; label: string; icon: typeof Layers }[] = [
  { id: "story", label: "Story", icon: Layers },
  { id: "read", label: "Read", icon: BookOpen },
  { id: "visualize", label: "Visual", icon: BarChart3 },
  { id: "audio", label: "Audio", icon: Headphones },
];

interface Props {
  current: LearnMode;
  onChange: (mode: LearnMode) => void;
}

export function ModeToggle({ current, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 p-1 bg-black/50 backdrop-blur-md border border-zinc-700/50 rounded-full">
      {MODES.map(({ id, label, icon: Icon }) => {
        const active = current === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-label={`Switch to ${label} mode`}
            className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
              active
                ? "bg-emerald-500/15 text-emerald-300"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Icon className="w-3 h-3" />
            <span className="text-[10px] font-bold hidden xs:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
