/**
 * Next.js 16 client-side instrumentation entry point.
 *
 * Initializes Sentry in the browser. Uses NEXT_PUBLIC_SENTRY_DSN so
 * the DSN is exposed to the client (this is normal and expected — DSN
 * is not a secret, it just identifies which Sentry project receives
 * events).
 *
 * If the DSN isn't set, Sentry never initializes and no monitoring
 * data is collected from the browser.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    debug: false,
    sendDefaultPii: false,
    environment: process.env.NODE_ENV ?? "development",
    integrations: [
      // Captures slow page loads and route transitions
      Sentry.browserTracingIntegration(),
    ],
  });
}
