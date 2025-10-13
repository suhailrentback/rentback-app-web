// lib/supabase/server.ts
// Canonical Supabase helpers for server components and route handlers.

import { cookies } from "next/headers";
import {
  createServerComponentClient,
  createRouteHandlerClient,
} from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server Component helper (RSC & layouts/pages under /app using server components)
 * We cast to SupabaseClient to avoid GenericSchema vs "public" inference issues on Vercel.
 */
export function createServerSupabase(): SupabaseClient {
  return createServerComponentClient({ cookies }) as unknown as SupabaseClient;
}

/**
 * Route Handler helper for files like: /app/[...]/route.ts
 * (We avoid writing the `**/` sequence inside comments because `*/` closes the block.)
 */
export function createRouteSupabase(): SupabaseClient {
  return createRouteHandlerClient({ cookies }) as unknown as SupabaseClient;
}

/** Back-compat aliases still referenced in a few files */
export const supabaseServer = createServerSupabase;
export const supabaseRoute = createRouteSupabase;
