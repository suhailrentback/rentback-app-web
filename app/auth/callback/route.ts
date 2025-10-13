// WEB /app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createRouteSupabase } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') || '/tenant'

  if (!code) {
    return NextResponse.redirect(new URL('/sign-in?error=missing_code', url))
  }

  const supabase = createRouteSupabase()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    const msg = encodeURIComponent(error.message)
    return NextResponse.redirect(new URL(`/sign-in?error=${msg}`, url))
  }

  // (Optional) upsert profile here later once DB is ready.

  return NextResponse.redirect(new URL(next, url))
}
