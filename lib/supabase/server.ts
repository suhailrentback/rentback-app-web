// lib/supabase/server.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Use inside Server Components & Route Handlers */
export function createServerSupabase() {
  const cookieStore = cookies();

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      // keep types loose here; Next’s cookie store has multiple overloads
      set(name: string, value: string, options?: any) {
        cookieStore.set(name, value, options);
      },
      remove(name: string, options?: any) {
        cookieStore.set(name, '', { ...options, maxAge: 0 });
      },
    },
  });
}

// Alias for route handlers (same thing)
export const createRouteSupabase = createServerSupabase;
