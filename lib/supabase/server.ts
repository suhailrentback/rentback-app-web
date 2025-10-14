// lib/supabase/server.ts
import { cookies } from "next/headers";
import {
  createServerComponentClient,
  createRouteHandlerClient,
} from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server Component helper for files like: app/**/page.tsx and app/**/layout.tsx
 * (No regex-looking comment tokens; keep this block simple to avoid SWC parsing issues.)
 */
export function createServerSupabase(): SupabaseClient {
  return createServerComponentClient({ cookies }) as unknown as SupabaseClient;
}

/**
 * Route Handler helper for files like: app/**/route.ts
 */
export function createRouteSupabase(): SupabaseClient {
  return createRouteHandlerClient({ cookies }) as unknown as SupabaseClient;
}

/**
 * Back-compat aliases so older imports keep working without touching other files.
 * You can migrate imports gradually to `createServerSupabase` / `createRouteSupabase`.
 */
export const supabaseServer = createServerSupabase;
export const supabaseRoute = createRouteSupabase;
