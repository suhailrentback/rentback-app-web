// WEB: /lib/supabaseClient.ts
// Safe client-only Supabase instance. If env vars are missing, this still builds.
// Do NOT move this to server in this wave (1.0). Guards come in 1.1/1.3.

'use client';

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
