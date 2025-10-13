// lib/auth/session.ts
import { createServerSupabase } from '@/lib/supabase/server'

export async function getSessionUser() {
  const supabase = createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) return null
  return user
}
