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

/**
 * Back-compat alias: some routes import { createRouteSupabase }.
 * Export it so we don't have to touch those routes.
 */
export const createRouteSupabase = createServerSupabase;
