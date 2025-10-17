'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Browser-side Supabase client */
export function getSupabaseBrowser(): SupabaseClient {
  return createBrowserClient(url, anon, {
    global: {
      fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
    },
  });
}
