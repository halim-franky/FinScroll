"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp } from "lucide-react";

interface Props {
  /** Are we currently looking at the very first card of the feed? */
  isFirstCard: boolean;
  /** Has the user scrolled at all yet this session? */
  hasScrolled: boolean;
}

const STORAGE_KEY = "fs_swipe_hint_dismissed";

/**
 * Floating "swipe up for next topic" hint.
 *
 * Behavior:
 *   - Shows on the first card while the user hasn't scrolled yet.
 *   - Auto-hides after 12s OR the moment the user scrolls — whichever first.
 *   - Once dismissed/auto-hidden, sets a localStorage flag and never shows
 *     again on the same device.
 *
 * Positioned just above the bottom navigation/chevron bar so it doesn't
 * fight any of the card's own controls.
 */
export function SwipeHint({ isFirstCard, hasScrolled }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isFirstCard) return;
    if (hasScrolled) {
      setShow(false);
      return;
    }
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {}
    // small delay so it appears AFTER the tutorial overlay (if active)
    const showTimer = setTimeout(() => setShow(true), 800);
    // auto-hide
    const hideTimer = setTimeout(() => {
      setShow(false);
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {}
    }, 12_800);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [isFirstCard, hasScrolled]);

  // Hide immediately on first scroll
  useEffect(() => {
    if (hasScrolled && show) {
      setShow(false);
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {}
    }
  }, [hasScrolled, show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.4 }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-full bg-zinc-900/80 backdrop-blur-md border border-emerald-500/30 shadow-[0_8px_24px_-8px_rgba(16,185,129,0.4)]"
          >
            <ChevronUp className="w-4 h-4 text-emerald-300" strokeWidth={3} />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">
              Swipe up for next
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
