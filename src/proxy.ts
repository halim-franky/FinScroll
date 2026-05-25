import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  // Legal + contact pages — must be reachable signed-out (App Store / GDPR
  // require non-users to be able to find privacy info + submit data requests
  // without first creating an account).
  "/privacy",
  "/terms",
  "/contact",
  "/api/contact",
  "/api/chat",
  "/api/search",
  // Vercel cron — authenticated by CRON_SECRET, not Clerk
  "/api/cron/(.*)",
  "/manifest.webmanifest",
  "/sw.js",
  "/offline.html",
  "/icon.svg",
  "/icon-maskable.svg",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) return;

  const { userId } = await auth();

  // API routes should return JSON 401, not an HTML redirect to sign-in
  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return;
  }

  // App routes: redirect to sign-in as usual
  if (!userId) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
