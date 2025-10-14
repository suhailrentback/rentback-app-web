// lib/supabase/server.ts
// Canonical Supabase helpers for Server Components and Route Handlers.
// Uses @supabase/auth-helpers-nextjs (already installed). We intentionally
// avoid strict generic return types to prevent TS generic mismatches.

import { cookies } from "next/headers";
import {
  createServerComponentClient,
  createRouteHandlerClient,
} from "@supabase/auth-helpers-nextjs";

// Server Components / layouts / pages (RSC, app router)
export function createServerSupabase() {
  return createServerComponentClient({ cookies }) as any;
}

// Route Handlers (files like app/**/route.ts)
export function createRouteSupabase() {
  return createRouteHandlerClient({ cookies }) as any;
}

// Back-compat aliases (so existing imports won't break)
export const supabaseServer = createServerSupabase;
export const supabaseRoute = createRouteSupabase;
