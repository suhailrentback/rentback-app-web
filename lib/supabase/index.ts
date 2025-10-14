// lib/supabase/index.ts
export {
  createServerSupabase,
  createRouteSupabase,
  supabaseServer,
  supabaseRoute,
} from "./server";

export {
  getSupabaseBrowser as createBrowserSupabase,
  getSupabaseBrowser,
  supabase as supabaseClient,
} from "../supabaseClient";
