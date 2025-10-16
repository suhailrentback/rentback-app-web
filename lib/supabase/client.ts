'use client';

import { createBrowserClient } from '@supabase/ssr';

// Keep a single browser instance
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowser() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  browserClient = createBrowserClient(url, anon, {
    global: {
      // TS 5-safe typing for fetch passthrough
      fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
    },
  });

  return browserClient;
}

// Back-compat: some files may import `createClient`
// This keeps them working without changing all call sites.
export const createClient = getSupabaseBrowser;

export default getSupabaseBrowser;
