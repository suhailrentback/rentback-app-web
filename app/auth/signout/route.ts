// app/sign-out/route.ts
import { NextResponse } from 'next/server'
import { createRouteSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = createRouteSupabase()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'https://www.rentback.app'))
}
