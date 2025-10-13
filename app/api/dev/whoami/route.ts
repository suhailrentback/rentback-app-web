// WEB /app/api/dev/whoami/route.ts
import { NextResponse } from 'next/server'
import { createRouteSupabase } from '../../../../lib/supabase/server'

export const runtime = 'nodejs' // Supabase libs expect Node runtime here

export async function GET() {
  const supabase = createRouteSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) return NextResponse.json({ error: error.message }, { status: 401 })
  return NextResponse.json({ user })
}
