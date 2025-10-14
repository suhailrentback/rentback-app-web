// lib/supabase/server.ts
import { cookies } from "next/headers";
import {
  createServerComponentClient,
  createRouteHandlerClient,
} from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

export function createServerSupabase(): SupabaseClient {
  return createServerComponentClient({ cookies }) as unknown as SupabaseClient;
}

export function createRouteSupabase(): SupabaseClient {
  return createRouteHandlerClient({ cookies }) as unknown as SupabaseClient;
}

// Back-compat aliases (safe to leave, helps during the transition)
export const supabaseServer = createServerSupabase;
export const supabaseRoute = createRouteSupabase;
