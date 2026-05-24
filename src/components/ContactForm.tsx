"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle, AlertTriangle } from "lucide-react";

type Subject =
  | "general"
  | "bug"
  | "feature"
  | "privacy"
  | "delete-account"
  | "other";

const SUBJECTS: { value: Subject; label: string }[] = [
  { value: "general", label: "General question" },
  { value: "bug", label: "Bug report" },
  { value: "feature", label: "Feature request" },
  { value: "privacy", label: "Privacy / data request" },
  { value: "delete-account", label: "Account deletion help" },
  { value: "other", label: "Other" },
];

const MESSAGE_MAX = 4000;
const MESSAGE_MIN = 5;

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<Subject>("general");
  const [message, setMessage] = useState("");
  // Honeypot — must stay empty. Bots fill all fields including hidden ones,
  // so a non-empty value is a strong bot signal that we silently drop.
  const [website, setWebsite] = useState("");

  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Captured at submit-time so the success view can still echo the address
  // back to the user even after we clear the live form fields.
  const [sentToEmail, setSentToEmail] = useState("");

  const messageLeft = MESSAGE_MAX - message.length;
  const trimmedMessage = message.trim();
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const isNameValid = trimmedName.length > 0;
  const isEmailValid = /.+@.+\..+/.test(trimmedEmail);
  const isMessageValid = trimmedMessage.length >= MESSAGE_MIN;
  const canSubmit =
    status !== "sending" && isNameValid && isEmailValid && isMessageValid;

  // Surface WHY the button is disabled so users aren't guessing
  const disabledReason = (() => {
    if (status === "sending") return null;
    if (!isNameValid) return "Add your name to send.";
    if (!isEmailValid) return "Add a valid email so we can reply.";
    if (!isMessageValid) {
      const need = MESSAGE_MIN - trimmedMessage.length;
      return trimmedMessage.length === 0
        ? `Write a short message (at least ${MESSAGE_MIN} characters).`
        : `Just ${need} more character${need === 1 ? "" : "s"} to go.`;
    }
    return null;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus("sending");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject,
          message: message.trim(),
          website, // honeypot — sent as-is so server sees the empty/filled state
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(
          data?.error ?? "Something went wrong sending your message.",
        );
      }

      setSentToEmail(email.trim());
      setStatus("sent");
      // Clear every field so a fresh submission starts blank
      setName("");
      setEmail("");
      setSubject("general");
      setMessage("");
      setWebsite("");
    } catch (err) {
      const m = err instanceof Error ? err.message : "Unknown error";
      setErrorMsg(m);
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <h2 className="text-base font-black text-white">Message sent</h2>
          <p className="text-[13px] text-zinc-100 leading-relaxed">
            Thanks for reaching out. We&apos;ll reply to{" "}
            <span className="font-semibold">{sentToEmail}</span>
            {" "}
            within 30 days (usually much sooner). Check your spam folder if
            you don&apos;t see a response.
          </p>
          <button
            onClick={() => setStatus("idle")}
            className="text-[12px] font-bold text-emerald-300 hover:text-emerald-200 underline underline-offset-2 mt-2"
          >
            Send another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl bg-zinc-900 border border-zinc-800 p-5"
    >
      {/* Name */}
      <Field label="Your name" htmlFor="name">
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          placeholder="Alex Tan"
          autoComplete="name"
          required
          className={inputClass}
        />
      </Field>

      {/* Email */}
      <Field label="Your email" htmlFor="email" hint="So we can reply to you.">
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={200}
          placeholder="alex@example.com"
          autoComplete="email"
          required
          className={inputClass}
        />
      </Field>

      {/* Subject */}
      <Field label="What's it about?" htmlFor="subject">
        <select
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value as Subject)}
          className={`${inputClass} appearance-none`}
        >
          {SUBJECTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>

      {/* Message */}
      <Field
        label="Message"
        htmlFor="message"
        hint={`${messageLeft} character${messageLeft === 1 ? "" : "s"} left`}
      >
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX))}
          rows={5}
          minLength={MESSAGE_MIN}
          placeholder="What can we help with?"
          required
          className={`${inputClass} resize-y min-h-[7rem]`}
        />
      </Field>

      {/* Honeypot — visually hidden but reachable to bots that ignore CSS */}
      <div
        aria-hidden="true"
        className="absolute"
        style={{
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        <label>
          Website (leave blank)
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      {/* Submit */}
      <div className="space-y-2 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-zinc-950 font-extrabold text-sm transition-colors"
          >
            {status === "sending" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Sending…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Send message
              </>
            )}
          </button>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            By submitting you agree to our{" "}
            <a
              href="/privacy"
              className="text-zinc-200 hover:text-white underline underline-offset-2"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
        {/* Tell the user WHY the button is disabled so they're not guessing.
            Stays accessible (aria-live) so screen readers announce updates. */}
        {disabledReason && (
          <p
            aria-live="polite"
            className="text-[11px] text-amber-300 font-medium"
          >
            {disabledReason}
          </p>
        )}
      </div>

      {status === "error" && errorMsg && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
          <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
          <p className="text-[12px] text-rose-100 leading-relaxed">
            {errorMsg}
          </p>
        </div>
      )}
    </form>
  );
}

const inputClass =
  "w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/60";

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className="block text-[11px] font-black uppercase tracking-widest text-zinc-200"
        >
          {label}
        </label>
        {hint && (
          <span className="text-[10px] text-zinc-500 tabular-nums">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}
