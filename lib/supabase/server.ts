// lib/supabase/server.ts
import { cookies as nextCookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
// If you have generated types, import them. Otherwise keep Database as any.
// import type { Database } from "@/lib/supabase/types";
type Database = any;

export function createClient(cookiesStore = nextCookies()) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookiesStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookiesStore.set({ name, value, ...options });
        } catch {
          // noop on edge where write may be disallowed
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookiesStore.set({ name, value: "", ...options, maxAge: 0 });
        } catch {
          // noop
        }
      },
    },
  });
}
