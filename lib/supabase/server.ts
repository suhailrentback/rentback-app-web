import { cookies } from "next/headers";
import {
  createServerComponentClient,
  createRouteHandlerClient,
} from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

// For Server Components (files like app/.../page.tsx or layout.tsx)
export function createServerSupabase(): SupabaseClient {
  return createServerComponentClient({ cookies }) as unknown as SupabaseClient;
}

// For Route Handlers (files named route.ts under app/)
export function createRouteSupabase(): SupabaseClient {
  return createRouteHandlerClient({ cookies }) as unknown as SupabaseClient;
}

// Back-compat aliases so older imports keep working.
export const supabaseServer = createServerSupabase;
export const supabaseRoute = createRouteSupabase;
