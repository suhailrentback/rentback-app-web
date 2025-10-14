// lib/supabaseClient.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;
const isBrowser = typeof window !== "undefined";

/**
 * Browser-side Supabase client (singleton).
 * - Safe in SSR/Edge: session features only in browser.
 * - Builds stay green even if envs are missing; runtime will surface errors.
 */
export function getSupabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  browserClient = createClient(url, anon, {
    auth: {
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
      detectSessionInUrl: isBrowser,
    },
  });

  return browserClient;
}

/** Back-compat: some pages import { supabase } from "@/lib/supabaseClient" */
export const supabase: SupabaseClient = getSupabaseBrowser();
