// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Create a Supabase client bound to Next.js server cookies.
// No explicit "public" generics — let types infer to avoid GenericSchema errors.
export function createServerSupabase() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options?: Parameters<typeof cookieStore.set>[0]['options']) {
        cookieStore.set({ name, value, ...(options ? { options } : {}) });
      },
      remove(name: string, options?: Parameters<typeof cookieStore.set>[0]['options']) {
        cookieStore.set({ name, value: '', options: { ...(options || {}), maxAge: 0 } });
      },
    },
    global: {
      // TS 5-safe typing for fetch passthrough
      fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
    },
  });
}

// Alias used by Route Handlers (`app/api/.../route.ts`)
export const createRouteSupabase = createServerSupabase;

export default createServerSupabase;
