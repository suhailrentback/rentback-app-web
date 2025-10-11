// lib/auth/session.ts
import { supabaseServer } from '@/lib/supabase/server';

export async function getSessionUser() {
  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
