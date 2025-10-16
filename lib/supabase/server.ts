// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Minimal cookie options we actually use.
// (Avoids the union type problem that caused the previous TS error.)
type CookieOptions = {
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: 'lax' | 'strict' | 'none';
  secure?: boolean;
  domain?: string;
};

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
        // Use the (name, value, options) overload; always set a path for consistency.
        cookieStore.set(name, value, { path: '/', ...(options || {}) });
      },
      remove(name: string, options?: CookieOptions) {
        // Clearing cookie by setting maxAge: 0; keep path consistent.
        cookieStore.set(name, '', { path: '/', ...(options || {}), maxAge: 0 });
      },
    },
    global: {
      // TS 5-safe fetch passthrough
      fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
    },
  });
}

// Alias for route handlers (app/api/.../route.ts)
export const createRouteSupabase = createServerSupabase;

export default createServerSupabase;
