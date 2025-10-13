// lib/supabase/server.ts
// Canonical Supabase helpers for server components and route handlers.
// Keep this file at the repo root under /lib/supabase/.

import { cookies } from "next/headers";
import {
  createServerComponentClient,
  createRouteHandlerClient,
} from "@supabase/auth-helpers-nextjs";
// We avoid strict generics here to prevent "GenericSchema" vs "public" TS friction.
import type { SupabaseClient } from "@supabase/supabase-js";

export function createServerSupabase(): SupabaseClient {
  return createServerComponentClient({ cookies }) as unknown as SupabaseClient;
}

export function createRouteSupabase(): SupabaseClient {
  return createRouteHandlerClient({ cookies }) as unknown as SupabaseClient;
}

// Friendly aliases kept for older imports across the app code.
export const supabaseServer = createServerSupabase;
export const supabaseRoute = createRouteSupabase;
