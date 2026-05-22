"use client";

import { Volume2, VolumeX } from "lucide-react";

const STORAGE_KEY = "finscroll_audio_enabled";

export function readAudioEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeAudioEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  } catch {}
}

interface Props {
  enabled: boolean;
  onToggle: (next: boolean) => void;
  className?: string;
}

export function AudioToggle({ enabled, onToggle, className = "" }: Props) {
  return (
    <button
      onClick={() => onToggle(!enabled)}
      aria-label={enabled ? "Disable audio narration" : "Enable audio narration"}
      className={`p-1.5 rounded-lg bg-black/40 backdrop-blur-sm border transition-colors ${
        enabled
          ? "border-emerald-500/40 text-emerald-400"
          : "border-zinc-700 text-zinc-500 hover:text-zinc-300"
      } ${className}`}
    >
      {enabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
    </button>
  );
}
