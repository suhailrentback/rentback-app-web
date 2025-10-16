// app/api/auth/sync/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { ROLE_COOKIE, type Role } from '@/lib/auth/roles';

export const runtime = 'nodejs';

export async function POST() {
  const supabase = getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const res = NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
    res.cookies.set(ROLE_COOKIE, '', { path: '/', httpOnly: true, secure: true, sameSite: 'lax', maxAge: 0 });
    return res;
  }

  // Read existing profile
  let role: Role | null = null;

  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    role = (existing?.role as Role | null) ?? null;
  } catch {
    role = null;
  }

  // Upsert if missing
  if (!role) {
    // If you want staff auto-detected by email domain, keep this; otherwise remove.
    const isStaff = (user.email || '').toLowerCase().endsWith('@rentback.app');
    role = (isStaff ? 'staff' : 'tenant') as Role;

    // If row exists with null role -> update; else insert
    await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email,
          role,
        },
        { onConflict: 'id' }
      )
      .select('role')
      .single()
      .catch(() => null);
  }

  const res = NextResponse.json({ role });
  // Short-lived cookie so middleware can be fast; refreshes on each sync
  res.cookies.set(ROLE_COOKIE, role!, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 20, // 20 minutes
  });
  return res;
}
