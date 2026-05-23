"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Save, Check, Sparkles } from "lucide-react";
import { saveNote, loadNote, NOTE_TEMPLATES, type CardNote } from "@/lib/learn/notes";

interface Props {
  userId: string;
  cardId: string | number;
  onSaved?: () => void;
}

interface SpeechRec {
  start: () => void;
  stop: () => void;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
}

interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}

function getRecognition(): SpeechRec | null {
  if (typeof window === "undefined") return null;
  const win = window as unknown as {
    SpeechRecognition?: new () => SpeechRec;
    webkitSpeechRecognition?: new () => SpeechRec;
  };
  const C = win.SpeechRecognition ?? win.webkitSpeechRecognition;
  return C ? new C() : null;
}

export function NotesInput({ userId, cardId, onSaved }: Props) {
  const [text, setText] = useState("");
  const [template, setTemplate] = useState<string | undefined>();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceUsed, setVoiceUsed] = useState(false);
  const recRef = useRef<SpeechRec | null>(null);

  // Load existing note for this card on mount
  useEffect(() => {
    const existing: CardNote | null = loadNote(userId, cardId);
    if (existing) {
      setText(existing.text);
      setTemplate(existing.template);
      setSavedAt(existing.updatedAt);
      setVoiceUsed(!!existing.voiceTranscribed);
    }
  }, [userId, cardId]);

  const handleTemplate = (id: string, label: string) => {
    if (template === id) {
      setTemplate(undefined);
      return;
    }
    setTemplate(id);
    if (!text.trim()) setText(label + " ");
  };

  const handleSave = () => {
    const result = saveNote(userId, cardId, text, { template, voiceTranscribed: voiceUsed });
    if (result) {
      setSavedAt(result.updatedAt);
      onSaved?.();
    }
  };

  const handleMic = () => {
    if (isRecording) {
      recRef.current?.stop();
      return;
    }
    const rec = getRecognition();
    if (!rec) return;
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setText((prev) => (prev ? `${prev} ${transcript}`.trim() : transcript));
      setVoiceUsed(true);
    };
    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);
    recRef.current = rec;
    setIsRecording(true);
    rec.start();
  };

  const speechAvailable = typeof window !== "undefined" && !!getRecognition();
  const isSaved = savedAt !== null && Date.now() - savedAt < 4000;

  return (
    <div className="w-full max-w-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Your note
        </span>
        {savedAt && !isSaved && (
          <span className="text-[9px] text-zinc-300">
            Saved {new Date(savedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Templates */}
      <div className="flex flex-wrap gap-1.5">
        {NOTE_TEMPLATES.map((t) => {
          const active = template === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleTemplate(t.id, t.label)}
              className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-colors ${
                active
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Text area */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 5000))}
          placeholder="Write what you learned, what you'll do, or what confused you..."
          rows={3}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl py-3 px-3 pr-10 text-zinc-100 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 resize-none"
        />
        {speechAvailable && (
          <button
            onClick={handleMic}
            aria-label={isRecording ? "Stop recording" : "Record voice note"}
            className={`absolute bottom-3 right-3 p-1.5 rounded-full transition-colors ${
              isRecording
                ? "bg-rose-500/15 border border-rose-500/40 text-rose-400 animate-pulse"
                : "bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white"
            }`}
          >
            {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={!text.trim()}
        className={`w-full h-10 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
          !text.trim()
            ? "bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed"
            : isSaved
            ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
            : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
        }`}
      >
        {isSaved ? (
          <>
            <Check className="w-3.5 h-3.5" /> Saved to My Notes
          </>
        ) : (
          <>
            <Save className="w-3.5 h-3.5" /> Save note
          </>
        )}
      </button>

      <p className="text-[9px] text-zinc-400 text-center leading-relaxed">
        Your notes live in <span className="text-zinc-200 font-bold">Stats → My Notes</span>.<br />
        AI will summarize them weekly.
      </p>
    </div>
  );
}
