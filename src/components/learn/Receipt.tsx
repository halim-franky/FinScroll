"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { Card } from "@/lib/learn/types";
import { computeImpact, formatCompactCurrency, HORIZON_YEARS } from "@/lib/learn/impact";
import { readOnboarding } from "@/components/OnboardingModal";
import { Check, X, Share2, Download, Loader2 } from "lucide-react";

interface Props {
  card: Card;
  userId: string;
  /** Index of the option the user picked on the quiz, or null if skipped. */
  quizAnswer: number | null;
}

/**
 * "Receipt" for completing a card.
 *
 * Styled like a thermal-paper receipt so it feels like a tangible artifact
 * the user earned. Shows: concept, quiz pass/fail, personalized 30-year
 * wealth added, streak, source, timestamp. Tap Share to capture as a PNG
 * and post to socials.
 *
 * NOTE on styling: all colors are inline-styled with explicit hex values
 * (not Tailwind classes) so `html-to-image` can faithfully serialize them.
 * Tailwind v4's `oklch()` tokens don't always round-trip through DOM →
 * canvas → PNG, which would produce a dark-on-dark unreadable receipt.
 */

const PAPER_BG = "#f4f4f5";       // zinc-100
const INK = "#18181b";            // zinc-900
const INK_MUTED = "#52525b";      // zinc-600
const DASH = "#a1a1aa";           // zinc-400
const ACCENT = "#047857";         // emerald-700
const ACCENT_BG = "#dcfce7";      // green-100
const ERR = "#b91c1c";            // red-700

/**
 * Stable multiplier in [0.7, 1.3] derived from a card identifier — gives
 * each receipt a unique-feeling number without changing for the same card
 * across reloads. djb2-ish hash, sufficient for variety here.
 */
function stableMultiplier(cardId: string | number): number {
  const s = String(cardId);
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash + s.charCodeAt(i)) | 0;
  }
  const norm = (Math.abs(hash) % 1000) / 1000; // 0..1
  return 0.7 + norm * 0.6; // 0.7..1.3
}

export function Receipt({ card, userId, quizAnswer }: Props) {
  const [streak, setStreak] = useState(0);
  const [shareState, setShareState] = useState<
    "idle" | "rendering" | "shared" | "saved" | "copied" | "error"
  >("idle");
  const [now, setNow] = useState<Date | null>(null);
  const receiptRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setNow(new Date());
    try {
      const s = localStorage.getItem("fs_streak");
      if (s) setStreak(parseInt(s, 10) || 0);
    } catch {}
  }, []);

  const impact = useMemo(() => {
    const onboarding = readOnboarding(userId);
    return computeImpact(onboarding);
  }, [userId]);

  const passed = quizAnswer !== null && quizAnswer === card.quiz.correctIndex;

  // Per-card wealth recovery — varies so each receipt feels like its own
  // win instead of the same flat number. Two sources of variation:
  //   • cardMult: deterministic from card.id, range [0.7, 1.3]. Different
  //     cards always show a different amount but the same card is stable.
  //   • outcomeMult: passing the quiz earns the full share, a wrong answer
  //     earns 85% (you still showed up), skipping the quiz earns 70%.
  const cardMult = useMemo(() => stableMultiplier(card.id), [card.id]);
  const outcomeMult = passed ? 1.0 : quizAnswer !== null ? 0.85 : 0.7;
  const perCardValue = (impact.futureValue / 12) * cardMult * outcomeMult;
  const wealthAdded = formatCompactCurrency(perCardValue);
  const fullName = card.title;
  const id = `FNS-${String(card.id).padStart(4, "0")}`;

  const date = now
    ? now.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" })
    : "—";
  const time = now
    ? now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : "—";

  const shareText = `📜 FinScroll receipt
${fullName} · ${card.topic}
${passed ? "✓ Quiz passed" : "○ Studied"}
+${wealthAdded} added to my ${HORIZON_YEARS}-year future
Day ${streak || 1} streak

I just learned this instead of doomscrolling. 📈`;

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    if (!receiptRef.current) return;

    setShareState("rendering");

    try {
      const dataUrl = await toPng(receiptRef.current, {
        pixelRatio: 2,
        // Use the paper color so the surrounding cutouts in the perforated
        // edges show as cream — not dark — when the PNG is rendered.
        backgroundColor: PAPER_BG,
        cacheBust: true,
        filter: (node) => {
          if (!(node instanceof HTMLElement)) return true;
          return !node.dataset.captureExclude;
        },
      });

      const blob = await (await fetch(dataUrl)).blob();
      const filename = `finscroll-receipt-${card.id}.png`;
      const file = new File([blob], filename, { type: "image/png" });

      const canShareFile =
        "canShare" in navigator &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] });

      if (canShareFile) {
        // No `text` payload — the receipt image already contains the concept,
        // wealth-added line, streak, and source visually. Passing the text
        // again would show it twice on platforms that render both.
        await navigator.share({
          title: "My FinScroll receipt",
          files: [file],
        });
        setShareState("shared");
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShareState("saved");
      }
    } catch (err) {
      const cancelled = err instanceof Error && err.name === "AbortError";
      if (cancelled) {
        setShareState("idle");
      } else {
        try {
          await navigator.clipboard.writeText(shareText);
          setShareState("copied");
        } catch {
          setShareState("error");
        }
      }
    }

    setTimeout(() => setShareState("idle"), 2600);
  };

  // Common style atoms
  const dashedBorder: React.CSSProperties = {
    borderTop: `1px dashed ${DASH}`,
  };
  const labelStyle: React.CSSProperties = {
    color: INK_MUTED,
    fontSize: "10px",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
  };

  return (
    <div
      ref={receiptRef}
      style={{
        backgroundColor: PAPER_BG,
        color: INK,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
        borderRadius: "12px",
        boxShadow: "0 10px 30px -5px rgba(0,0,0,0.4)",
        position: "relative",
      }}
    >
      {/* Perforated top edge */}
      <div
        style={{
          height: "12px",
          backgroundColor: PAPER_BG,
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
          maskImage:
            "radial-gradient(circle at 8px 12px, transparent 4px, black 4.5px)",
          maskSize: "16px 12px",
          maskRepeat: "repeat-x",
          WebkitMaskImage:
            "radial-gradient(circle at 8px 12px, transparent 4px, black 4.5px)",
          WebkitMaskSize: "16px 12px",
          WebkitMaskRepeat: "repeat-x",
        }}
      />

      <div style={{ padding: "0 20px 20px" }}>
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            paddingBottom: "8px",
            borderBottom: `1px dashed ${DASH}`,
          }}
        >
          <div
            style={{
              fontSize: "16px",
              fontWeight: 900,
              letterSpacing: "0.2em",
              color: INK,
            }}
          >
            FINSCROLL
          </div>
          <div style={{ ...labelStyle, marginTop: "2px" }}>
            Receipt of attention
          </div>
        </div>

        {/* Concept block */}
        <div style={{ padding: "8px 0" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              ...labelStyle,
            }}
          >
            <span>{id}</span>
            <span>{card.topic}</span>
          </div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              lineHeight: 1.3,
              paddingTop: "4px",
              color: INK,
            }}
          >
            {fullName}
          </div>
        </div>

        {/* Status rows */}
        <div style={{ ...dashedBorder, padding: "8px 0" }}>
          <Row label="QUIZ">
            {passed ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontWeight: 700,
                  color: ACCENT,
                  backgroundColor: ACCENT_BG,
                  padding: "1px 6px",
                  borderRadius: "4px",
                }}
              >
                <Check style={{ width: "12px", height: "12px" }} /> PASSED
              </span>
            ) : quizAnswer !== null ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontWeight: 700,
                  color: ERR,
                }}
              >
                <X style={{ width: "12px", height: "12px" }} /> RETRY
              </span>
            ) : (
              <span style={{ fontWeight: 700, color: INK_MUTED }}>STUDIED</span>
            )}
          </Row>
          <Row label="STREAK">
            <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: INK }}>
              {streak} day{streak === 1 ? "" : "s"}
            </span>
          </Row>
        </div>

        {/* Hero */}
        <div style={{ ...dashedBorder, padding: "12px 0", textAlign: "center" }}>
          <div style={labelStyle}>Added to your {HORIZON_YEARS}-year future</div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: 900,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.02em",
              paddingTop: "2px",
              color: ACCENT,
            }}
          >
            +{wealthAdded}
          </div>
          <div
            style={{
              fontSize: "10px",
              color: INK_MUTED,
              lineHeight: 1.3,
              paddingTop: "4px",
            }}
          >
            modeled at 8% return · scaled by concept and quiz result
          </div>
        </div>

        {/* Source */}
        <div style={{ ...dashedBorder, paddingTop: "8px" }}>
          <div style={{ ...labelStyle, marginBottom: "4px" }}>Source</div>
          <a
            href={card.source.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: ACCENT,
              textDecoration: "none",
              display: "block",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {card.source.name}
          </a>
        </div>

        {/* Footer */}
        <div
          style={{
            ...dashedBorder,
            marginTop: "8px",
            paddingTop: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              color: INK_MUTED,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {date} · {time}
          </div>
          <button
            onClick={handleShare}
            disabled={shareState === "rendering"}
            data-capture-exclude="true"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "6px",
              backgroundColor: INK,
              color: PAPER_BG,
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              border: "none",
              cursor: shareState === "rendering" ? "wait" : "pointer",
              opacity: shareState === "rendering" ? 0.7 : 1,
            }}
          >
            {shareState === "rendering" ? (
              <>
                <Loader2 style={{ width: "12px", height: "12px" }} className="animate-spin" />
                Rendering
              </>
            ) : shareState === "shared" ? (
              <>
                <Check style={{ width: "12px", height: "12px" }} /> Shared
              </>
            ) : shareState === "saved" ? (
              <>
                <Download style={{ width: "12px", height: "12px" }} /> Saved
              </>
            ) : shareState === "copied" ? (
              <>
                <Check style={{ width: "12px", height: "12px" }} /> Copied
              </>
            ) : shareState === "error" ? (
              <>
                <X style={{ width: "12px", height: "12px" }} /> Try again
              </>
            ) : (
              <>
                <Share2 style={{ width: "12px", height: "12px" }} /> Share
              </>
            )}
          </button>
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: "10px",
            color: INK_MUTED,
            paddingTop: "8px",
            margin: 0,
          }}
        >
          ★ THANK YOU FOR LEARNING ★
        </p>
      </div>

      {/* Perforated bottom edge */}
      <div
        style={{
          height: "12px",
          backgroundColor: PAPER_BG,
          borderBottomLeftRadius: "12px",
          borderBottomRightRadius: "12px",
          maskImage:
            "radial-gradient(circle at 8px 0px, transparent 4px, black 4.5px)",
          maskSize: "16px 12px",
          maskRepeat: "repeat-x",
          WebkitMaskImage:
            "radial-gradient(circle at 8px 0px, transparent 4px, black 4.5px)",
          WebkitMaskSize: "16px 12px",
          WebkitMaskRepeat: "repeat-x",
        }}
      />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "11px",
        paddingBottom: "2px",
      }}
    >
      <span
        style={{
          color: INK_MUTED,
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          fontSize: "10px",
        }}
      >
        {label}
      </span>
      <span>{children}</span>
    </div>
  );
}
