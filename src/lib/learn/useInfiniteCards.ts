"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Card } from "./types";

/**
 * useInfiniteCards
 *
 * Extends the Learn feed past its static + daily cards by fetching
 * fresh RAG-generated cards from /api/cards/generate as the user
 * approaches the end of the current feed.
 *
 * Behavior:
 *   • Prefetches when `activeIndex` is within `prefetchAhead` of the
 *     last card in the combined (base + extra) list.
 *   • Tracks every seedId we've already fetched and sends it as
 *     `excludeSeedIds` so the server picks something fresh.
 *   • If the server returns 429 or any error, enters a 60-second
 *     cooldown and stops trying. The feed silently keeps working off
 *     the base cards (caller is responsible for recycling them).
 *   • Caches generated cards in localStorage so revisits don't
 *     regenerate — important for keeping the free-tier quota
 *     comfortable across reloads.
 */

const CACHE_KEY = "fs_infinite_cards_v1";
const COOLDOWN_MS = 60_000;
const MAX_EXTRA = 50; // soft ceiling — well within free tier

const DEV = process.env.NODE_ENV === "development";
function devLog(...args: unknown[]) {
  if (!DEV) return;
  // eslint-disable-next-line no-console
  console.debug("[infiniteCards]", ...args);
}

interface CachedCard {
  card: Card;
  seedId: string;
}

function loadCachedCards(): CachedCard[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CachedCard[];
  } catch {
    return [];
  }
}

function saveCachedCards(cards: CachedCard[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cards.slice(-MAX_EXTRA)));
  } catch {
    // Storage full or disabled — silently drop the cache, doesn't break feature
  }
}

interface Options {
  /** Active card index in the *combined* feed (base + extra). */
  activeIndex: number;
  /** Length of the base feed (static cards + daily). */
  baseLength: number;
  /** Trigger prefetch when activeIndex >= total - prefetchAhead. */
  prefetchAhead?: number;
  /** Enable/disable infinite fetching. Useful to gate behind a feature flag. */
  enabled?: boolean;
}

export function useInfiniteCards({
  activeIndex,
  baseLength,
  prefetchAhead = 2,
  enabled = true,
}: Options) {
  // Hydrate from localStorage on mount so the same user doesn't burn
  // Gemini quota on every reload.
  const [extras, setExtras] = useState<CachedCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fallback, setFallback] = useState(false);
  const cooldownUntilRef = useRef(0);
  const inFlightRef = useRef(false);

  useEffect(() => {
    setExtras(loadCachedCards());
  }, []);

  const fetchOne = useCallback(async () => {
    if (!enabled) {
      devLog("skip — disabled");
      return;
    }
    if (inFlightRef.current) {
      devLog("skip — already in flight");
      return;
    }
    if (Date.now() < cooldownUntilRef.current) {
      devLog(
        `skip — cooldown until ${new Date(cooldownUntilRef.current).toISOString()}`,
      );
      return;
    }
    if (extras.length >= MAX_EXTRA) {
      devLog(`skip — reached MAX_EXTRA (${MAX_EXTRA})`);
      return;
    }

    inFlightRef.current = true;
    setIsLoading(true);
    devLog("fetching /api/cards/generate…", { excludeCount: extras.length });

    try {
      const excludeSeedIds = extras.map((e) => e.seedId);
      const res = await fetch("/api/cards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excludeSeedIds }),
      });

      if (!res.ok) {
        const body = await res.text();
        devLog(`HTTP ${res.status} — entering cooldown`, body.slice(0, 200));
        cooldownUntilRef.current = Date.now() + COOLDOWN_MS;
        setFallback(true);
        return;
      }

      const data = (await res.json()) as {
        card?: Card;
        seedId?: string;
        cached?: boolean;
      };

      if (!data.card || !data.seedId) {
        devLog("response missing card/seedId — entering cooldown", data);
        cooldownUntilRef.current = Date.now() + COOLDOWN_MS;
        setFallback(true);
        return;
      }

      devLog(
        `got card "${data.card.title}" (seedId=${data.seedId}, cached=${data.cached})`,
      );
      setExtras((prev) => {
        const next = [...prev, { card: data.card!, seedId: data.seedId! }];
        saveCachedCards(next);
        return next;
      });
      setFallback(false);
    } catch (err) {
      devLog("fetch threw — entering cooldown", err);
      cooldownUntilRef.current = Date.now() + COOLDOWN_MS;
      setFallback(true);
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
    }
  }, [enabled, extras]);

  // Trigger prefetch when the user is close to the end of the combined feed
  useEffect(() => {
    if (!enabled) return;
    const total = baseLength + extras.length;
    if (total === 0) return;
    const shouldFetch = activeIndex >= total - prefetchAhead;
    devLog(
      `tick: active=${activeIndex}, baseLen=${baseLength}, extras=${extras.length}, total=${total}, threshold=${total - prefetchAhead}, shouldFetch=${shouldFetch}`,
    );
    if (shouldFetch) {
      void fetchOne();
    }
  }, [enabled, activeIndex, baseLength, extras.length, prefetchAhead, fetchOne]);

  const extraCards = extras.map((e) => e.card);

  return {
    extraCards,
    isLoading,
    fallback,
  };
}
