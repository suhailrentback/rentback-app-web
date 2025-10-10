// lib/supabase/client.ts
'use client';

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !anon) {
  // Surface a readable runtime hint in dev; safe no-op in prod.
  // eslint-disable-next-line no-console
  console.warn('Supabase env missing: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabaseBrowser = () => createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    flowType: 'pkce',
  },
});
