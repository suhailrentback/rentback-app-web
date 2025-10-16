// lib/supabase/server.ts
import { cookies } from 'next/headers';
import {
  createServerClient,
  type CookieOptions,
  type SupabaseClient,
} from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function getSupabaseServer(): SupabaseClient<any, any, any> {
  const cookieStore = cookies();

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options?: CookieOptions) {
        // Next 14 supports set(name, value, options)
        cookieStore.set(name, value, options as any);
      },
      remove(name: string, options?: CookieOptions) {
        cookieStore.set(name, '', { ...(options as any), maxAge: 0 });
      },
    },
    global: { fetch },
  });
}
