// WEB /lib/supabase/server.ts
import { cookies } from 'next/headers';
import {
  createServerComponentClient,
  createRouteHandlerClient,
} from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';

// New canonical helpers
export function createServerSupabase(): SupabaseClient {
  return createServerComponentClient({ cookies });
}
export function createRouteSupabase(): SupabaseClient {
  return createRouteHandlerClient({ cookies });
}

// Back-compat names (some files import these)
export function supabaseServer(): SupabaseClient {
  return createServerComponentClient({ cookies });
}
export function supabaseRoute(): SupabaseClient {
  return createRouteHandlerClient({ cookies });
}
