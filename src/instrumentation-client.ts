/**
 * Next.js 16 client-side instrumentation entry point.
 *
 * Initializes Sentry in the browser for ERROR monitoring only. Uses
 * NEXT_PUBLIC_SENTRY_DSN so the DSN is exposed to the client (this is
 * normal and expected — DSN is not a secret, it just identifies which
 * Sentry project receives events).
 *
 * Core Web Vitals and page-load/route performance are intentionally NOT
 * collected here — that job belongs to Vercel Speed Insights (mounted in
 * app/layout.tsx). Collecting Web Vitals in both would duplicate the data
 * and burn Sentry's limited free-tier performance-transaction quota, so
 * we drop browserTracingIntegration and set tracesSampleRate to 0.
 *
 * If the DSN isn't set, Sentry never initializes and no monitoring
 * data is collected from the browser.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Errors only — no performance tracing on the client (see note above).
    tracesSampleRate: 0,
    debug: false,
    sendDefaultPii: false,
    environment: process.env.NODE_ENV ?? "development",
  });
}
