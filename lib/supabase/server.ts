// lib/supabase/server.ts
// Server-side Supabase helpers (App Router)

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Internal factory so pages and route handlers use the same wiring */
function makeServerClient() {
  const cookieStore = cookies();

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      // Use the 3-arg API to avoid TS type mismatches with the object form
      set(name: string, value: string, options?: any) {
        cookieStore.set(name, value, options as any);
      },
      remove(name: string, options?: any) {
        cookieStore.set(name, "", { ...(options || {}), maxAge: 0 });
      },
    },
  });
}

/** For Server Components / layouts / pages */
export function createServerSupabase() {
  return makeServerClient();
}

/** For Route Handlers (app/api/*) */
export function createRouteSupabase() {
  return makeServerClient();
}

/** Admin client (service role) for server-only tasks like profile upserts */
export function getSupabaseAdmin(): SupabaseClient {
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createAdminClient(url, service);
}

/** Back-compat alias some files may import */
export const getSupabaseServer = createServerSupabase;
