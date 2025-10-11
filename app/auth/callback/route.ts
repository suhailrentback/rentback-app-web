// app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase/server';

type Role = 'TENANT' | 'LANDLORD' | 'STAFF' | 'ADMIN';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/';

  const site = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@rentback.app').toLowerCase();
  const isAdminApp = site.includes('admin.');

  if (!code) {
    return NextResponse.redirect(new URL('/sign-in?error=Missing%20code', site));
  }

  const supabase = supabaseServer();

  // 1) Exchange code for a session
  const { error: xErr } = await supabase.auth.exchangeCodeForSession(code);
  if (xErr) {
    return NextResponse.redirect(new URL(`/sign-in?error=${encodeURIComponent(xErr.message)}`, site));
  }

  // 2) Ensure Profile row exists and set default role
  const { data: { user }, error: uErr } = await supabase.auth.getUser();
  if (uErr || !user || !user.email) {
    return NextResponse.redirect(new URL('/sign-in?error=No%20user', site));
  }
  const email = user.email.toLowerCase();

  // upsert Profile with default role TENANT
  await supabase.from('Profile').upsert({
    id: user.id,
    email,
    role: 'TENANT' as Role,
  }, { onConflict: 'id' });

  // 3) Admin app hard gate: only ADMIN/STAFF allowed (and auto-promote admin email)
  if (isAdminApp) {
    if (email === adminEmail) {
      // promote seed admin on first login (idempotent)
      await supabase.from('Profile').update({ role: 'ADMIN' as Role }).eq('id', user.id);
    }

    // check role
    const { data: prof, error: pErr } = await supabase
      .from('Profile')
      .select('role')
      .eq('id', user.id)
      .limit(1)
      .single();

    const role = (prof?.role || 'TENANT') as Role;

    if (pErr || (role !== 'ADMIN' && role !== 'STAFF')) {
      // block access on admin app
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/sign-in?error=Not%20authorized', site));
    }
  }

  // 4) Success → go to requested destination (default '/')
  return NextResponse.redirect(new URL(next, site));
}
