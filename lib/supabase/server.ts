// lib/supabase/server.ts
// Unified Supabase helpers for Server Components & Route Handlers.
// Exports: createClient, createServerSupabase, createRouteSupabase

import { cookies as nextCookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// If you generated DB types, import them here.
// import type { Database } from "@/lib/supabase/types";
type Database = any;

function makeClient(cookiesStore = nextCookies()) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supbaseEnvOK(supabaseUrl, supabaseKey)) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment."
    );
  }

  return createServerClient<Database>(supabaseUrl!, supabaseKey!, {
    cookies: {
      get(name: string) {
        try {
          return cookiesStore.get(name)?.value;
        } catch {
          return undefined;
        }
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookiesStore.set({ name, value, ...options });
        } catch {
          // On some edge contexts, setting cookies can be restricted; ignore.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookiesStore.set({ name, value: "", ...options, maxAge: 0 });
        } catch {
          // Ignore if not allowed.
        }
      },
    },
  });
}

function supbaseEnvOK(url?: string, key?: string) {
  return !!url && !!key;
}

/**
 * For Server Components / server actions.
 * Usage: const sb = createServerSupabase();
 */
export function createServerSupabase() {
  return makeClient(nextCookies());
}

/**
 * For Route Handlers (GET/POST in app/api/*).
 * Usage: const sb = createRouteSupabase();
 * (Optionally accepts a cookies store if you manage one.)
 */
export function createRouteSupabase(cookiesStore = nextCookies()) {
  return makeClient(cookiesStore);
}

/**
 * Backward-compatible name used in some pages.
 * Usage: const sb = createClient();
 */
export function createClient(cookiesStore = nextCookies()) {
  return makeClient(cookiesStore);
}

export default createServerSupabase;
