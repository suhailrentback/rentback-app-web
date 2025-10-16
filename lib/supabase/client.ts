'use client';

// lib/supabase/client.ts
// Canonical browser Supabase client for app/** client components.
// Exports:
//   - supabaseClient  (singleton)
//   - createBrowserSupabase()  (returns the singleton)

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Safe defaults for SPA flows
export const supabaseClient: SupabaseClient = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function createBrowserSupabase(): SupabaseClient {
  return supabaseClient;
}
