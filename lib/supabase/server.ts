// app/lib/supabase/server.ts
// Pass-through re-exports so existing relative imports like
// "../../lib/supabase/server" keep working from deep routes.
export {
  createServerSupabase,
  createRouteSupabase,
  supabaseServer,
  supabaseRoute,
} from "../../../lib/supabase/server";
