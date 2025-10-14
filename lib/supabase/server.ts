// lib/supabase/server.ts
// Canonical Supabase helpers for server components and route handlers.

import { cookies } from "next/headers";
import {
  createServerComponentClient,
  createRouteHandlerClient,
} from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

// Server Components (layouts/pages rendered on the server)
export function createServerSupabase(): SupabaseClient {
  return createServerComponentClient({ cookies }) as unknown as SupabaseClient;
}

// Route Handlers (files like: /app/[...]/route.ts)
export function createRouteSupabase(): SupabaseClient {
  return createRouteHandlerClient({ cookies }) as unknown as SupabaseClient;
}

// Back-compat aliases so older imports still work
export const supabaseServer = createServerSupabase;
export const supabaseRoute = createRouteSupabase;
