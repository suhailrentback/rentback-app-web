// lib/supabase/client.ts
'use client';

import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Browser-side Supabase client */
export function getSupabaseBrowser() {
  return createBrowserClient(url, anon, {
    global: {
      // TS/Next-friendly fetch passthrough
      fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
    },
  });
}
