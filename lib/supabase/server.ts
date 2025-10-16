import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Server/Route Supabase client (type inferred) */
export function getSupabaseServer() {
  const store = cookies();

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return store.get(name)?.value;
      },
      set(name: string, value: string, options?: CookieOptions) {
        store.set(name, value, options);
      },
      remove(name: string, options?: CookieOptions) {
        store.set(name, '', { ...(options || {}), maxAge: 0 });
      },
    },
    global: { fetch },
  });
}

/** Back-compat exports so existing imports keep working */
export const createServerSupabase = getSupabaseServer;
export const createRouteSupabase = getSupabaseServer;
export const supabaseServer = getSupabaseServer;
export const supabaseRoute = getSupabaseServer;
