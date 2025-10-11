// lib/supabase/server.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export function supabaseServer() {
  const cookieStore = cookies();

  const cookieShim = {
    get: (name: string) => cookieStore.get(name)?.value,
    set: (name: string, value: string, options: any) =>
      cookieStore.set({ name, value, ...options }),
    remove: (name: string, options: any) =>
      cookieStore.set({ name, value: '', ...options, maxAge: 0 }),
  } as any;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieShim }
  );
}
