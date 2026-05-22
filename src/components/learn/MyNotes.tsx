"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, FileText, Download, Trash2 } from "lucide-react";
import {
  loadAllNotes,
  notesAsMarkdown,
  deleteNote,
  NOTE_TEMPLATES,
  type CardNote,
} from "@/lib/learn/notes";
import { CARDS } from "@/lib/learn/cards";

interface Props {
  userId: string;
}

const TEMPLATE_LABELS: Record<string, string> = Object.fromEntries(
  NOTE_TEMPLATES.map((t) => [t.id, t.label])
);

export function MyNotes({ userId }: Props) {
  const [notes, setNotes] = useState<CardNote[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setNotes(loadAllNotes(userId));
  }, [userId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!q) return sorted;
    return sorted.filter((n) => {
      const card = CARDS.find((c) => String(c.id) === String(n.cardId));
      const hay = `${n.text} ${n.template ?? ""} ${card?.title ?? ""} ${card?.topic ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [notes, query]);

  const handleExport = () => {
    const md = notesAsMarkdown(notes);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finscroll-notes-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = (cardId: string | number) => {
    deleteNote(userId, cardId);
    setNotes(loadAllNotes(userId));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 px-1">
          My Notes
        </h3>
        {notes.length > 0 && (
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
          >
            <Download className="w-3 h-3" /> Export
          </button>
        )}
      </div>

      {notes.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
          <input
            type="search"
            placeholder="Search your notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-500/40"
          />
        </div>
      )}

      {notes.length === 0 ? (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-center space-y-2">
          <FileText className="w-8 h-8 text-zinc-700 mx-auto" />
          <p className="text-xs text-zinc-500 leading-relaxed">
            No notes yet. Open any card and tap <span className="text-emerald-400 font-bold">📝</span>{" "}
            to write your first one.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const card = CARDS.find((c) => String(c.id) === String(n.cardId));
            return (
              <div
                key={String(n.cardId)}
                className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3.5 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{card?.emoji ?? "📝"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-zinc-100 truncate">
                      {card?.title ?? `Card #${n.cardId}`}
                    </div>
                    <div className="text-[9px] text-zinc-500">
                      {new Date(n.updatedAt).toLocaleDateString()}{" "}
                      {n.voiceTranscribed && (
                        <span className="text-emerald-400">· 🎤 voice</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(n.cardId)}
                    aria-label="Delete note"
                    className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {n.template && (
                  <p className="text-[10px] text-emerald-400 font-bold italic">
                    {TEMPLATE_LABELS[n.template] ?? n.template}
                  </p>
                )}
                <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {n.text}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
