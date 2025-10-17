// app/api/auth/sync/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs'; // SSR libs expect Node here

/** Ensures profile row & role value exist; sets rb_role cookie; returns { role } */
export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteSupabase();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ role: null }, { status: 401 });

  // Read role if present
  let role = cookieStore.get('rb_role')?.value ?? null;

  // Ensure a profile exists & has a role; default => tenant
  if (!role) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    role = profile?.role ?? 'tenant';

    // Attempt to upsert (ok if RLS allows insert-on-missing for owner)
    await supabase
      .from('profiles')
      .upsert({ id: session.user.id, role })
      .select('role')
      .single();
  }

  const res = NextResponse.json({ role });
  res.cookies.set({
    name: 'rb_role',
    value: role,
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
