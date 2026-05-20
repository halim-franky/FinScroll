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

const VERSION = "finscroll-v1";
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

// ── Fetch: routed by request type ──────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Cross-origin: pass through untouched
  if (url.origin !== self.location.origin) return;

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
          // Cache successful HTML responses for offline
          if (response.ok) {
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
