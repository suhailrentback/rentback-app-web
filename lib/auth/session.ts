// lib/auth/session.ts
import { createServerSupabase } from "@/lib/supabase/server";

export async function getSessionUser() {
  const supabase = createServerSupabase();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
