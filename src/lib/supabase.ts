/**
 * Server-side Supabase client.
 *
 * Uses the service-role key, so this module must NEVER be imported
 * from client components. Returns null if env vars are not configured,
 * which lets API routes degrade gracefully to localStorage-only mode.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined = undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Treat placeholder strings as not configured
  const isPlaceholder = (s: string | undefined) =>
    !s ||
    s.length < 20 ||
    s.includes("YOUR_") ||
    s.includes("REPLACE_");

  if (isPlaceholder(url) || isPlaceholder(key)) {
    cached = null;
    return null;
  }

  cached = createClient(url!, key!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return getSupabase() !== null;
}
