// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteSupabase } from '../../..//lib/supabase/server'

export const dynamic = 'force-dynamic' // never cached; safe for auth

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/'

  const supabase = createRouteSupabase()

  // 1) Exchange the code for a session (magic-link / OAuth)
  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  // 2) Best-effort profile upsert + read role
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    try {
      // Upsert into 'profiles' (id, email, name, role); defaults to TENANT
      const profileRow = {
        id: user.id,
        email: user.email ?? null,
        name: (user.user_metadata as any)?.full_name ?? null,
        role: 'TENANT',
        updated_at: new Date().toISOString(),
      }

      const { error: upsertErr } = await supabase
        .from('profiles')
        .upsert(profileRow, { onConflict: 'id' })

      if (upsertErr) {
        console.warn('[profiles upsert skipped]', upsertErr.message)
      }

      // Try to read back the role (if table exists)
      let role = 'TENANT'
      const { data: prof, error: readErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (!readErr && prof?.role) {
        role = String(prof.role)
      }

      // 3) Set a simple cookie for client-side checks later (no UI change now)
      const res = NextResponse.redirect(new URL(next, url.origin))
      res.cookies.set('rb_role', role, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        secure: true,
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
      return res
    } catch (e) {
      console.warn('[auth callback] profile step skipped', e)
      return NextResponse.redirect(new URL(next, url.origin))
    }
  }

  // Fallback: just go home/next
  return NextResponse.redirect(new URL(next, url.origin))
}
