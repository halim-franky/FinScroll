import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rateLimit";

// ── Schemas ──────────────────────────────────────────────────────────
const OnboardingSchema = z.object({
  struggle: z.enum(["saving", "debt", "investing", "all"]),
  scroll_hours: z.number().int().min(1).max(24),
  goal: z.enum(["first_1k", "first_investment", "pay_debt", "emergency_fund"]),
  skipped: z.boolean(),
});

const ProgressSchema = z.object({
  streak: z.number().int().min(0).max(10_000).optional(),
  streak_date: z.string().nullable().optional(),
  completed: z.record(z.string().max(100), z.boolean()).optional(),
  liked: z.record(z.string().max(100), z.boolean()).optional(),
  saved: z.record(z.string().max(100), z.boolean()).optional(),
  weekly_log: z.array(z.number().int().min(0)).max(1000).optional(),
});

const StateUpdateSchema = z.object({
  onboarding: OnboardingSchema.optional(),
  progress: ProgressSchema.optional(),
});

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
    return NextResponse.json(
      { error: "Failed to load user state." },
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
  const { allowed } = rateLimit(`state:${userId}`, 30, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
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
          { user_id: userId, ...parsed.data.onboarding },
          { onConflict: "user_id" }
        );
      if (error) throw error;
    }

    if (parsed.data.progress) {
      const { error } = await supabase
        .from("user_progress")
        .upsert(
          { user_id: userId, ...parsed.data.progress },
          { onConflict: "user_id" }
        );
      if (error) throw error;
    }

    return NextResponse.json({ ok: true, configured: true });
  } catch (err) {
    console.error("Supabase push failed:", err);
    return NextResponse.json(
      { error: "Failed to save user state." },
      { status: 500 }
    );
  }
}
