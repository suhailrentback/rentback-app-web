// lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Server-side Supabase client for reading the session in Server Components
 * and route handlers. Writes are no-ops here because most pages only need reads.
 */
export function createServerSupabase() {
  const store = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value;
        },
        // No-ops in this read helper. If you need to write/delete in a route,
        // do it on the response object in that specific route.
        set(_name: string, _value: string, _options: CookieOptions) {},
        remove(_name: string, _options: CookieOptions) {},
      },
    }
  );
}

/**
 * Back-compat export so existing files that import `createRouteSupabase`
 * keep working without edits.
 */
export { createServerSupabase as createRouteSupabase };
