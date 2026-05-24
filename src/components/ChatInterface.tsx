"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Loader2, Sparkles, BookOpen } from "lucide-react";
import { CARDS } from "@/lib/learn/cards";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  sources?: string[];
}

interface CardContext {
  title: string;
  topic: string;
  keyFact: string;
}

const DEFAULT_WELCOME =
  "Hey 👋 Ask me anything about money. I'll answer with SEC research, peer-reviewed economics, and zero finfluencer hype.";

const DEFAULT_SUGGESTIONS = [
  "How do I start investing with $100?",
  "Explain compound interest like I'm 15.",
  "What's the safest place to park my emergency fund?",
];

export function ChatInterface() {
  const searchParams = useSearchParams();
  const cardIdParam = searchParams.get("cardId");

  // ── Resolve cardContext from the URL param ───────────────────────────
  const cardContext = useMemo<CardContext | null>(() => {
    if (!cardIdParam) return null;
    const card = CARDS.find((c) => String(c.id) === cardIdParam);
    if (!card) return null;
    return {
      title: card.title,
      topic: card.topic,
      keyFact: card.keyFact,
    };
  }, [cardIdParam]);

  // ── Initial AI message: card-aware if we have context ────────────────
  const initialMessage = useMemo<Message>(() => {
    if (cardContext) {
      return {
        id: "init-1",
        role: "ai",
        text: `Let's go deeper on **${cardContext.title}** 🧠\n\nYou just learned the headline — what do you want to explore next? Pick a quick prompt below or type your own.`,
      };
    }
    return { id: "init-1", role: "ai", text: DEFAULT_WELCOME };
  }, [cardContext]);

  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  // suggestion chips disappear after the first user message
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-grow the textarea up to ~5 lines, then scroll inside it.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const max = 140; // ~5 lines at 14px
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
  }, [input]);

  // If the URL changes (e.g. user nav between cards), reset the chat to the
  // new context. Keeps the interface predictable.
  useEffect(() => {
    setMessages([initialMessage]);
    setShowSuggestions(true);
  }, [initialMessage]);

  // Auto-scroll to the bottom on every message change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isTyping]);

  const suggestionPrompts = useMemo<string[]>(() => {
    if (cardContext) {
      return [
        `Walk me through an example of ${cardContext.title}.`,
        `How does ${cardContext.topic.toLowerCase()} apply to my finances right now?`,
        `What's a common mistake people make with this?`,
      ];
    }
    return DEFAULT_SUGGESTIONS;
  }, [cardContext]);

  const sendMessage = async (text: string) => {
    const clean = text.trim();
    if (!clean || isTyping) return;

    setShowSuggestions(false);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      text: clean,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: clean,
          // Send card context so the RAG layer can anchor retrieval + prompt
          ...(cardContext ? { cardContext } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: data.data.reply,
        sources: data.data.sources,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: `Oops, something went wrong connecting to my brain. 🧠 (${msg})`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  return (
    <div className="w-full h-full bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
      {/* Header — shows the concept anchor when we have one */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0">
          <Sparkles className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-zinc-100 truncate">
            FinScroll Coach
          </h3>
          {cardContext ? (
            <p className="text-[11px] text-sky-300 font-bold tracking-wide truncate">
              Anchored on · {cardContext.title}
            </p>
          ) : (
            <p className="text-xs text-zinc-300 font-medium tracking-wide">
              Grounded · SEC & academic research
            </p>
          )}
        </div>
      </div>

      {/* Message history.
          - `overflow-x-hidden` is defense-in-depth: even if a bubble somehow
            outgrew its column the page can't sprout a horizontal scrollbar. */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-5 space-y-5 scroll-smooth"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[85%] min-w-0 ${
              msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
            }`}
          >
            <div
              // Inline styles for word-break — Tailwind v4's arbitrary
              // `[overflow-wrap:anywhere]` and `break-words` weren't taking
              // effect for unbroken character runs (e.g. "oooowwww…"). Setting
              // both `overflow-wrap` and `word-break` directly forces the
              // browser to break inside any character.
              style={{
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
              className={`p-3.5 rounded-2xl text-[14px] leading-relaxed min-w-0 max-w-full ${
                msg.role === "user"
                  ? "bg-emerald-600 text-emerald-50 rounded-br-sm whitespace-pre-wrap"
                  : "bg-zinc-800/80 text-zinc-100 border border-zinc-700/50 rounded-bl-sm"
              }`}
            >
              {msg.role === "user" ? (
                msg.text
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Compact spacing tuned for chat bubbles
                    p: ({ children }) => (
                      <p className="mb-2 last:mb-0">{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-white">{children}</strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-zinc-200">{children}</em>
                    ),
                    h1: ({ children }) => (
                      <h4 className="font-extrabold text-white text-[15px] mt-3 first:mt-0 mb-1">
                        {children}
                      </h4>
                    ),
                    h2: ({ children }) => (
                      <h4 className="font-extrabold text-white text-[15px] mt-3 first:mt-0 mb-1">
                        {children}
                      </h4>
                    ),
                    h3: ({ children }) => (
                      <h4 className="font-bold text-emerald-200 text-[13px] uppercase tracking-widest mt-3 first:mt-0 mb-1">
                        {children}
                      </h4>
                    ),
                    h4: ({ children }) => (
                      <h4 className="font-bold text-emerald-200 text-[13px] uppercase tracking-widest mt-3 first:mt-0 mb-1">
                        {children}
                      </h4>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-5 space-y-1 mb-2 last:mb-0 marker:text-emerald-400">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-5 space-y-1 mb-2 last:mb-0 marker:text-emerald-400 marker:font-bold">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="leading-relaxed">{children}</li>
                    ),
                    code: ({ children }) => (
                      <code className="px-1 py-0.5 rounded bg-zinc-700/60 text-emerald-300 text-[12px] font-mono">
                        {children}
                      </code>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-300 hover:text-sky-200 underline underline-offset-2"
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              )}
            </div>

            {/* Source citations */}
            {msg.role === "ai" && msg.sources && msg.sources.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5 px-1">
                {msg.sources.map((source, idx) => {
                  const isUrl =
                    source.startsWith("http://") ||
                    source.startsWith("https://");
                  return isUrl ? (
                    <a
                      key={idx}
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20 hover:bg-sky-500/20 transition-colors"
                    >
                      <BookOpen className="w-3 h-3" />
                      {new URL(source).hostname.replace("www.", "")}
                    </a>
                  ) : (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20"
                    >
                      <BookOpen className="w-3 h-3" />
                      {source}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {/* Suggestion chips — show before the user's first message, both for
            card-anchored chats and the default Coach landing. */}
        {showSuggestions && suggestionPrompts.length > 0 && (
          <div className="flex flex-col gap-2 max-w-[85%] mr-auto">
            {suggestionPrompts.map((q) => (
              <button
                key={q}
                onClick={() => void sendMessage(q)}
                className="text-left text-[13px] text-zinc-100 bg-zinc-900 border border-zinc-700 hover:border-sky-500/40 hover:bg-zinc-800 rounded-2xl px-3.5 py-2.5 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {isTyping && (
          <div className="flex max-w-[80%] mr-auto items-start">
            <div className="p-3.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 rounded-bl-sm flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
      </div>

      {/* Input bar — auto-growing textarea so long prompts wrap instead of
          getting truncated with an ellipsis. Enter sends, Shift+Enter inserts
          a newline (standard chat UX). */}
      <div className="p-3 bg-zinc-900 border-t border-zinc-800">
        <form onSubmit={handleSubmit} className="relative flex items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage(input);
              }
            }}
            placeholder={
              cardContext ? `Ask about ${cardContext.title}…` : "Ask anything…"
            }
            rows={1}
            className="w-full max-h-[140px] bg-zinc-950 border border-zinc-800 rounded-3xl py-3.5 pl-5 pr-14 text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-[14px] resize-none overflow-y-auto leading-snug"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={isTyping || !input.trim()}
            className="absolute right-1.5 bottom-1.5 w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            {isTyping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4 ml-0.5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
