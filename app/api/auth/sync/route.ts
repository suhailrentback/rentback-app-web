// app/api/auth/sync/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type Body = {
  access_token?: string;
  refresh_token?: string;
};

async function upsertProfileRole(supabase: ReturnType<typeof createServerSupabase>) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user ?? null;
  if (!user) return null;

  // Ensure profile row exists with a role
  const { data: prof } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  let role = prof?.role ?? 'tenant';
  if (!prof) {
    const { data: inserted } = await supabase
      .from('profiles')
      .insert({ id: user.id, email: user.email, role })
      .select('role')
      .single();
    role = inserted?.role ?? role;
  }

  // Mirror role into a simple cookie the middleware can read
  cookies().set({
    name: 'rb_role',
    value: String(role),
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
  });

  return role as 'tenant' | 'landlord' | 'staff';
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;

  const supabase = createServerSupabase();

  // If tokens provided (email+password flow), set session cookies server-side
  if (body.access_token && body.refresh_token) {
    await supabase.auth.setSession({
      access_token: body.access_token,
      refresh_token: body.refresh_token,
    });
  }

  const role = await upsertProfileRole(supabase);
  return NextResponse.json({ role });
}

export async function GET() {
  const supabase = createServerSupabase();
  const role = await upsertProfileRole(supabase);
  return NextResponse.json({ role });
}
