// lib/supabase/server.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client for RSC, layouts, and route handlers.
 * Uses anon key; no cookie/session work here (keeps build green).
 */
export function createServerSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  return createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/** Back-compat aliases: keep old imports working without touching routes */
export const createRouteSupabase = createServerSupabase;
export const supabaseServer = createServerSupabase;
export const supabaseRoute = createServerSupabase;
