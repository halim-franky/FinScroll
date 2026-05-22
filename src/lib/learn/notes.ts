/**
 * Notes persistence + retrieval.
 *
 * Notes are keyed per (userId, cardId). Persisted to localStorage and
 * synced to Supabase via the existing /api/me/state pipeline alongside
 * other learn-progress data.
 */

export interface CardNote {
  cardId: string | number;
  text: string;
  template?: string;       // e.g. "applies_to_me" / "action_item"
  voiceTranscribed?: boolean;
  createdAt: number;
  updatedAt: number;
}

export const NOTE_TEMPLATES = [
  { id: "applies_to_me", label: "This applies to me because…" },
  { id: "action_item", label: "Action item:" },
  { id: "question", label: "I have a question about…" },
  { id: "remember", label: "Remember:" },
] as const;

const STORAGE_KEY = (uid: string) => `finscroll_notes_${uid}`;

export function loadAllNotes(userId: string): CardNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (n): n is CardNote =>
        n !== null &&
        typeof n === "object" &&
        typeof n.cardId !== "undefined" &&
        typeof n.text === "string"
    );
  } catch {
    return [];
  }
}

export function loadNote(userId: string, cardId: string | number): CardNote | null {
  return loadAllNotes(userId).find((n) => String(n.cardId) === String(cardId)) ?? null;
}

export function saveNote(
  userId: string,
  cardId: string | number,
  text: string,
  opts: { template?: string; voiceTranscribed?: boolean } = {}
): CardNote | null {
  if (typeof window === "undefined") return null;
  const cleaned = text.trim();
  if (cleaned.length === 0) return null;
  if (cleaned.length > 5000) return null; // sane upper bound

  const all = loadAllNotes(userId);
  const now = Date.now();
  const existingIdx = all.findIndex((n) => String(n.cardId) === String(cardId));

  const note: CardNote = {
    cardId,
    text: cleaned,
    template: opts.template,
    voiceTranscribed: !!opts.voiceTranscribed,
    createdAt: existingIdx >= 0 ? all[existingIdx].createdAt : now,
    updatedAt: now,
  };

  if (existingIdx >= 0) all[existingIdx] = note;
  else all.push(note);

  try {
    localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(all));
  } catch {}

  return note;
}

export function deleteNote(userId: string, cardId: string | number): void {
  if (typeof window === "undefined") return;
  const all = loadAllNotes(userId).filter(
    (n) => String(n.cardId) !== String(cardId)
  );
  try {
    localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(all));
  } catch {}
}

export function notesAsMarkdown(notes: CardNote[]): string {
  if (notes.length === 0) return "# My FinScroll Notes\n\n(No notes yet.)";
  const lines = ["# My FinScroll Notes", ""];
  const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
  for (const n of sorted) {
    const date = new Date(n.updatedAt).toLocaleDateString();
    lines.push(`## Card #${n.cardId} — ${date}`);
    if (n.template) lines.push(`_Template: ${n.template}_`);
    lines.push("");
    lines.push(n.text);
    lines.push("");
  }
  return lines.join("\n");
}
