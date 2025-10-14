// lib/supabase/server.ts
import {
  createRouteHandlerClient,
  createServerComponentClient,
} from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

// For Server Components, Pages, and Layouts
export function createServerSupabase(): SupabaseClient {
  return createServerComponentClient({ cookies });
}

// For API Routes and Route Handlers
export function createRouteSupabase(): SupabaseClient {
  return createRouteHandlerClient({ cookies });
}
