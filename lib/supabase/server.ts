// lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server Component helper (for app/**/page.tsx, app/**/layout.tsx)
 * Keep this comment simple to avoid SWC parsing quirks.
 */
export function createServerSupabase(): SupabaseClient {
  const store = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          store.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          store.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  ) as unknown as SupabaseClient;
}

/** Route Handler helper (for app/**/route.ts files) */
export function createRouteSupabase(): SupabaseClient {
  // In our setup, route handlers can share the same adapter safely.
  return createServerSupabase();
}

/** Back-compat aliases used in older code */
export const supabaseServer = createServerSupabase;
export const supabaseRoute = createRouteSupabase;

export type { SupabaseClient } from "@supabase/supabase-js";
