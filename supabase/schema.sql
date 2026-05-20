-- ──────────────────────────────────────────────────────────────────────
-- FinScroll — Supabase schema
--
-- Run this once in your Supabase project's SQL editor.
-- Authentication is handled by Clerk; this schema only needs to store
-- per-user state keyed by the Clerk userId. Access is enforced at the
-- API route layer using the service-role key, so RLS is OFF here.
-- ──────────────────────────────────────────────────────────────────────

-- ── Onboarding answers ───────────────────────────────────────────────
create table if not exists public.user_onboarding (
  user_id        text primary key,                  -- Clerk userId
  struggle       text not null check (struggle in ('saving','debt','investing','all')),
  scroll_hours   integer not null check (scroll_hours between 1 and 24),
  goal           text not null check (goal in ('first_1k','first_investment','pay_debt','emergency_fund')),
  skipped        boolean not null default false,
  completed_at   timestamptz not null default now()
);

comment on table public.user_onboarding is 'One row per FinScroll user — answers from the 3-step onboarding modal.';

-- ── Per-user progress ────────────────────────────────────────────────
create table if not exists public.user_progress (
  user_id        text primary key,                  -- Clerk userId
  streak         integer not null default 0,
  streak_date    date,
  completed      jsonb not null default '{}'::jsonb, -- { cardId: true, ... }
  liked          jsonb not null default '{}'::jsonb,
  saved          jsonb not null default '{}'::jsonb,
  weekly_log     jsonb not null default '[]'::jsonb, -- array of completion timestamps
  updated_at     timestamptz not null default now()
);

comment on table public.user_progress is 'Per-user learning progress synced from the client. Authoritative copy across devices.';

-- ── Auto-updated_at trigger ──────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_progress_updated_at on public.user_progress;
create trigger trg_user_progress_updated_at
  before update on public.user_progress
  for each row
  execute function public.set_updated_at();
