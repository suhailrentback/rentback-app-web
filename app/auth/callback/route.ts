// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs' // avoid Edge runtime limitations

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') || '/tenant' // default target for the consumer app

  const supabase = createRouteSupabase()

  if (code) {
    // Exchanges ?code=... for a session cookie (HttpOnly)
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(next, url.origin))
}
