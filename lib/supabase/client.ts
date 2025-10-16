// lib/supabase/client.ts
'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Browser-only Supabase client */
export function getSupabaseBrowser(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createBrowserClient(url, anon, {
    global: {
      // ✅ Properly typed rest args so TS 5 is happy
      fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
    },
  });
}
