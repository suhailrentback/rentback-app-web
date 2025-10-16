// lib/supabase/index.ts
export {
  createServerSupabase,
  // back-compat names other files import:
  createServerSupabase as createRouteSupabase,
  createServerSupabase as supabaseServer,
  createServerSupabase as supabaseRoute,
} from "./server";

export { createBrowserSupabase, supabaseClient } from "./client";
