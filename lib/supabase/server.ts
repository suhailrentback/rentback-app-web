// lib/supabase/server.ts
import { cookies } from 'next/headers';
import {
  createServerClient,
  type CookieOptions,
  type SupabaseClient,
} from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Primary server-side Supabase client factory.
 * Works in Route Handlers, Server Components, and Middleware (when passed cookie bridges).
 */
export function getSupabaseServer(): SupabaseClient<any, any, any> {
  const store = cookies();

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return store.get(name)?.value;
      },
      set(name: string, value: string, options?: CookieOptions) {
        // Next 14 supports set(name, value, options)
        store.set(name, value, options as any);
      },
      remove(name: string, options?: CookieOptions) {
        store.set(name, '', { ...(options as any), maxAge: 0 });
      },
    },
    global: { fetch },
  });
}

/** ---- Back-compat named exports (aliases) ----
 * Some files import older helper names. These aliases make those imports work
 * without touching the rest of your codebase.
 */
export const createServerSupabase = getSupabaseServer;
export const createRouteSupabase = getSupabaseServer;
export const supabaseServer = getSupabaseServer;
export const supabaseRoute = getSupabaseServer;
