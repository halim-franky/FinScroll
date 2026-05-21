/**
 * Next.js 16 server-side instrumentation entry point.
 *
 * Runs once when the server boots. Initializes Sentry for both the
 * Node runtime and the Edge runtime, only when a DSN is configured.
 * Without a DSN the app runs fine — no monitoring, but no errors either.
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (!process.env.SENTRY_DSN) return;

  // The same config works for both Node and Edge — Sentry's SDK detects
  // the runtime internally.
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    debug: false,
    sendDefaultPii: false,
    environment: process.env.NODE_ENV ?? "development",
    ignoreErrors: [
      "AbortError",
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
    ],
  });
}

// Forwards Next.js's onRequestError hook to Sentry so server errors in
// server components, route handlers, and middleware are all captured.
export { captureRequestError as onRequestError } from "@sentry/nextjs";
