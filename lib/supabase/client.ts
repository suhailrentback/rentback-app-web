// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let singleton: SupabaseClient | null = null;

export function createBrowserSupabase(): SupabaseClient {
  if (singleton) return singleton;

  singleton = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as unknown as SupabaseClient;

  return singleton;
}

// Back-compat alias used by some components
export const supabaseClient = createBrowserSupabase;

export type { SupabaseClient } from "@supabase/supabase-js";
