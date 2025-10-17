// /lib/supabase/server.ts
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
// Tip: no explicit SupabaseClient return type here to avoid schema generic mismatches

export function createServerSupabase() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options?: CookieOptions) {
        cookieStore.set(name, value, options);
      },
      remove(name: string, options?: CookieOptions) {
        // Next.js cookies API: emulate remove by setting maxAge=0
        cookieStore.set(name, '', { ...options, maxAge: 0 });
      },
    },
  });
}

// Alias for API routes/middleware that just need the same server client
export function createRouteSupabase() {
  return createServerSupabase();
}

// ✅ Export the alias the API route is importing
export { createServerSupabase as getSupabaseServer };
