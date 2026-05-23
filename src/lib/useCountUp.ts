"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Count up to a target number over a duration with ease-out cubic.
 *
 * The hook only runs when `enabled` is true so we can defer count-up
 * until a frame is actually on screen (avoids the number animating
 * out of view while the user is on a different frame).
 *
 * Returns a plain number that the caller can format however they want.
 */
export function useCountUp(
  target: number,
  durationMs = 1200,
  enabled = true
): number {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setValue(0);
      startedRef.current = false;
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;

    if (target === 0) {
      setValue(0);
      return;
    }

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, enabled]);

  return value;
}

/**
 * Extracts the leading numeric portion of a string and the surrounding
 * text. Useful for animating something like "$2.1M" or "$600/mo" where
 * we want the digits to count up but keep the prefix/suffix static.
 *
 * Returns { prefix, number, suffix } where number is a parsed float.
 * If no number is found, returns the input as prefix.
 */
export function splitNumeric(text: string): {
  prefix: string;
  number: number | null;
  suffix: string;
  formatter: (n: number) => string;
} {
  // Match optional non-numeric prefix, then a number (possibly with decimals
  // or commas or K/M/B suffix), then optional suffix.
  const match = text.match(/^([^\d-]*)(-?[\d,.]+)([KMBkmb]?)(.*)$/);
  if (!match) return { prefix: text, number: null, suffix: "", formatter: () => text };

  const [, prefix, numStr, scale, rest] = match;
  const num = parseFloat(numStr.replace(/,/g, ""));
  if (!Number.isFinite(num)) return { prefix: text, number: null, suffix: "", formatter: () => text };

  const scaleFactor =
    scale.toUpperCase() === "K" ? 1_000 :
    scale.toUpperCase() === "M" ? 1_000_000 :
    scale.toUpperCase() === "B" ? 1_000_000_000 : 1;

  const formatter = (n: number) => {
    const scaledBack = n / scaleFactor;
    let formatted: string;
    if (scaleFactor === 1) {
      // Plain integer
      formatted = Math.round(scaledBack).toLocaleString();
    } else {
      // K / M / B — keep one decimal if needed
      formatted = scaledBack.toFixed(scaledBack < 10 ? 1 : 0);
    }
    return `${prefix}${formatted}${scale}${rest}`;
  };

  return { prefix, number: num, suffix: scale + rest, formatter };
}
