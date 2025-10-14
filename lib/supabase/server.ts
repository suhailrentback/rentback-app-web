// lib/supabase/server.ts
// Canonical Supabase helpers for Server Components and Route Handlers.
// Uses @supabase/auth-helpers-nextjs (already installed). Return types are
// intentionally cast to avoid TS generic mismatches during build.

import { cookies } from "next/headers";
import {
  createServerComponentClient,
  createRouteHandlerClient,
} from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Server Components / layouts / pages (App Router RSC) */
export function createServerSupabase(): SupabaseClient {
  return createServerComponentClient({ cookies }) as unknown as SupabaseClient;
}

/** Route Handlers (files in /app/**/route.ts) */
export function createRouteSupabase(): SupabaseClient {
  return createRouteHandlerClient({ cookies }) as unknown as SupabaseClient;
}

/** Back-compat aliases so older imports still work */
export const supabaseServer = createServerSupabase;
export const supabaseRoute = createRouteSupabase;
