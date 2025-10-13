// WEB /lib/supabase/server.ts
import { cookies } from 'next/headers';
import {
  createServerComponentClient,
  createRouteHandlerClient
} from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';

// For server components (RSC)
export function createServerSupabase(): SupabaseClient {
  return createServerComponentClient({ cookies });
}

// For route handlers (app/*/route.ts)
export function createRouteSupabase(): SupabaseClient {
  return createRouteHandlerClient({ cookies });
}
