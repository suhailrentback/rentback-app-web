// lib/supabase/server.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client for RSC and route handlers.
 * Uses the public anon key and does not persist sessions on the server.
 */
export function createServerSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  // Note: we do not throw on missing envs here to keep builds green.
  // If envs are missing at runtime, Supabase calls will fail clearly.
  return createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
