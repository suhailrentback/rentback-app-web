'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Browser-side Supabase client */
export function getSupabaseBrowser(): SupabaseClient {
  return createBrowserClient(url, anon, {
    global: {
      // TS-safe rest args so Next/TS 5 are happy
      fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
    },
  });
}

/** Back-compat aliases (some files import these) */
export const createClient = getSupabaseBrowser;
export const supabaseClient = getSupabaseBrowser;
