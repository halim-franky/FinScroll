"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on mount.
 * No UI — this component renders nothing.
 */
export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Only register in production to avoid clashing with Next.js dev HMR.
    if (process.env.NODE_ENV !== "production") return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch (err) {
        // Silent fail — PWA is enhancement, not core
        console.warn("Service worker registration failed:", err);
      }
    };

    // Defer registration to after the page is interactive
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
