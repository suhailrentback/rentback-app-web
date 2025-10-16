// lib/supabase/client.ts
'use client';

import { createBrowserClient, type SupabaseClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function getSupabaseBrowser(): SupabaseClient<any, any, any> {
  // keep the typings relaxed to avoid schema generic mismatches
  return createBrowserClient(url, anon, {
    global: { fetch },
  });
}
