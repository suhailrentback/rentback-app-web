// lib/supabase/server.ts
import { cookies } from "next/headers";
import {
  createServerComponentClient,
  createRouteHandlerClient,
} from "@supabase/auth-helpers-nextjs";

/**
 * Server component client (use inside server components / pages)
 */
export function createServerSupabase() {
  return createServerComponentClient({ cookies });
}

/**
 * Route handler client (use inside app router API routes)
 */
export function createRouteSupabase() {
  return createRouteHandlerClient({ cookies });
}

/**
 * Back-compat export names still referenced in a few places.
 * Keeping these avoids “not exported” build errors.
 */
export const supabaseServer = createServerSupabase;
export const supabaseRoute = createRouteSupabase;
