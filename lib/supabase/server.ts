// lib/supabase/server.ts
// Canonical Supabase helpers for server components and route handlers.

import { cookies } from "next/headers";
import {
  createServerComponentClient,
  createRouteHandlerClient,
} from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

// Loosen generics to avoid "GenericSchema" vs "public" TS friction on Vercel.
export function createServerSupabase(): SupabaseClient {
  return createServerComponentClient({ cookies }) as unknown as SupabaseClient;
}

export function createRouteSupabase(): SupabaseClient {
  return createRouteHandlerClient({ cookies }) as unknown as SupabaseClient;
}

// Back-compat aliases used by some files.
export const supabaseServer = createServerSupabase;
export const supabaseRoute = createRouteSupabase;
