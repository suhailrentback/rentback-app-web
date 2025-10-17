// /app/api/auth/sync/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Ensures there's a profile row + role, and sets rb_role cookie.
 * Returns { role } for the currently signed-in user.
 */
export async function GET() {
  const supabase = getSupabaseServer();

  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes?.user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const user = userRes.user;
  let role: string | null = null;

  // 1) Read role if profile exists
  try {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    role = data?.role ?? null;
  } catch {
    role = null;
  }

  // 2) If no row/role, upsert a default tenant role
  if (!role) {
    try {
      const { data } = await supabase
        .from('profiles')
        .upsert({ id: user.id, email: user.email, role: 'tenant' }, { onConflict: 'id' })
        .select('role')
        .single();
      role = data?.role ?? 'tenant';
    } catch {
      role = 'tenant';
    }
  }

  // 3) Sync cookie so middleware/pages can route fast
  const res = NextResponse.json({ role });
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  cookies().set('rb_role', role!, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    secure: true,
    maxAge,
  });

  return res;
}
