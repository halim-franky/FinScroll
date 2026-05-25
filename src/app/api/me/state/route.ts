import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

// ── Schemas ──────────────────────────────────────────────────────────
// .strict() rejects any unknown keys (e.g. attacker submitting `user_id`)
// instead of silently stripping. Belt-and-suspenders defense — even though
// the route also overwrites user_id from the Clerk session.
const OnboardingSchema = z
  .object({
    struggle: z.enum(["saving", "debt", "investing", "all"]),
    scroll_hours: z.number().int().min(1).max(24),
    goal: z.enum(["first_1k", "first_investment", "pay_debt", "emergency_fund"]),
    skipped: z.boolean(),
  })
  .strict();

const ProgressSchema = z
  .object({
    streak: z.number().int().min(0).max(10_000).optional(),
    streak_date: z.string().nullable().optional(),
    completed: z.record(z.string().max(100), z.boolean()).optional(),
    liked: z.record(z.string().max(100), z.boolean()).optional(),
    saved: z.record(z.string().max(100), z.boolean()).optional(),
    weekly_log: z.array(z.number().int().min(0)).max(1000).optional(),
  })
  .strict();

const StateUpdateSchema = z
  .object({
    onboarding: OnboardingSchema.optional(),
    progress: ProgressSchema.optional(),
  })
  .strict();

// ── GET — pull state ─────────────────────────────────────────────────
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    // Graceful degradation: app works in localStorage-only mode
    return NextResponse.json({
      configured: false,
      onboarding: null,
      progress: null,
    });
  }

  try {
    const [onboardingRes, progressRes] = await Promise.all([
      supabase.from("user_onboarding").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_progress").select("*").eq("user_id", userId).maybeSingle(),
    ]);

    return NextResponse.json({
      configured: true,
      onboarding: onboardingRes.data,
      progress: progressRes.data,
    });
  } catch (err) {
    console.error("Supabase pull failed:", err);
    Sentry.captureException(err, {
      tags: { route: "api/me/state", op: "pull" },
      user: { id: userId },
    });
    return NextResponse.json(
      { error: "Failed to load user state." },
      { status: 500 }
    );
  }
}

// ── DELETE — wipe state ──────────────────────────────────────────────
// Used by Settings → Reset Onboarding / Clear All Data so that the next
// CloudSync.pullState() doesn't restore the rows we just cleared locally.
//
// Query string controls scope:
//   ?scope=onboarding  → onboarding row only
//   ?scope=all         → onboarding + progress rows (full wipe)
export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await rateLimit(`state-delete:${userId}`, 5, 60_000);
  if (!result.allowed) {
    return rateLimitResponse(result);
  }

  const scope = new URL(req.url).searchParams.get("scope");
  if (scope !== "onboarding" && scope !== "all") {
    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: true, configured: false });
  }

  try {
    const { error: obError } = await supabase
      .from("user_onboarding")
      .delete()
      .eq("user_id", userId);
    if (obError) throw obError;

    if (scope === "all") {
      const { error: progError } = await supabase
        .from("user_progress")
        .delete()
        .eq("user_id", userId);
      if (progError) throw progError;
    }

    return NextResponse.json({ ok: true, configured: true });
  } catch (err) {
    console.error("Supabase delete failed:", err);
    Sentry.captureException(err, {
      tags: { route: "api/me/state", op: "delete", scope },
      user: { id: userId },
    });
    return NextResponse.json(
      { error: "Failed to clear user state." },
      { status: 500 }
    );
  }
}

// ── POST — push state ────────────────────────────────────────────────
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Per-user rate limit: 30 writes per minute (reasonable for debounced sync)
  const result = await rateLimit(`state:${userId}`, 30, 60_000);
  if (!result.allowed) {
    return rateLimitResponse(result);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = StateUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request payload" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();
  if (!supabase) {
    // Accept the write silently so client retry logic doesn't get stuck.
    return NextResponse.json({ ok: true, configured: false });
  }

  try {
    if (parsed.data.onboarding) {
      const { error } = await supabase
        .from("user_onboarding")
        .upsert(
          // user_id MUST come last so even a malformed payload cannot override
          // the server-verified Clerk userId. Combined with .strict() above,
          // this provides two independent guards against user-id spoofing.
          { ...parsed.data.onboarding, user_id: userId },
          { onConflict: "user_id" }
        );
      if (error) throw error;
    }

    if (parsed.data.progress) {
      const { error } = await supabase
        .from("user_progress")
        .upsert(
          { ...parsed.data.progress, user_id: userId },
          { onConflict: "user_id" }
        );
      if (error) throw error;
    }

    return NextResponse.json({ ok: true, configured: true });
  } catch (err) {
    console.error("Supabase push failed:", err);
    Sentry.captureException(err, {
      tags: { route: "api/me/state", op: "push" },
      user: { id: userId },
    });
    return NextResponse.json(
      { error: "Failed to save user state." },
      { status: 500 }
    );
  }
}
