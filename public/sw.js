/**
 * FinScroll service worker.
 *
 * Strategy:
 *   - Static assets (icons, manifest, offline page) → cache-first
 *   - HTML navigations → network-first, fallback to /offline.html
 *   - API calls → network-only (never cached — auth-sensitive)
 *   - Other GETs → stale-while-revalidate
 *
 * Cache is versioned. Bumping the version invalidates the old cache.
 */

// Bumping VERSION invalidates the old cache. Bump whenever a precached asset
// (icon, manifest, offline page) changes — otherwise installed PWAs keep
// serving the stale file. v3 ships the refined F-mark icon set.
const VERSION = "finscroll-v3";
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

const PRECACHE = [
  "/offline.html",
  "/icon.svg",
  "/icon-maskable.svg",
  "/manifest.webmanifest",
];

// ── Install: precache the offline shell ────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// ── Activate: clean up old caches ───────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(VERSION))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// During local dev the dev server compiles on demand and can briefly return
// 404s while files move around. Caching those would poison every reload.
const IS_DEV =
  self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1";

// ── Fetch: routed by request type ──────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Cross-origin: pass through untouched
  if (url.origin !== self.location.origin) return;

  // In dev: bypass the SW entirely. Avoids "stuck 404" loops when routes change.
  if (IS_DEV) return;

  // Skip caching API routes — they're auth-sensitive and dynamic
  if (url.pathname.startsWith("/api/")) return;

  // Skip Clerk's runtime endpoints
  if (
    url.pathname.includes("__clerk") ||
    url.pathname.includes("/clerk_") ||
    url.hostname.includes("clerk")
  ) {
    return;
  }

  // Skip Next.js internal HMR / data routes during navigation
  if (url.pathname.startsWith("/_next/static/chunks/webpack")) return;

  // Navigation requests: network-first, fall back to offline page
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful HTML responses (never 404/500)
          if (response.ok && response.status === 200) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match("/offline.html");
        })
    );
    return;
  }

  // Static assets: cache-first with background revalidation
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached || new Response("Offline", { status: 503 }));

      return cached || network;
    })
  );
});
