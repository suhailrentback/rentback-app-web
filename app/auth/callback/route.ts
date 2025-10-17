// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteSupabase } from '@/lib/supabase/server';

function pathForRole(role: string | null) {
  switch (role) {
    case 'landlord':
      return '/landlord';
    case 'staff':
    case 'admin':
      return '/admin';
    default:
      return '/tenant';
  }
}

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const supabase = createRouteSupabase();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = '/sign-in';
    return NextResponse.redirect(url);
  }

  // Call our own sync (server-side work here; no client flash)
  const urlSync = req.nextUrl.clone();
  urlSync.pathname = '/api/auth/sync';
  const syncRes = await fetch(urlSync, { cache: 'no-store' });
  const { role } = (await syncRes.json()) as { role: string | null };

  const url = req.nextUrl.clone();
  url.pathname = pathForRole(role ?? 'tenant');
  url.searchParams.delete('next');
  return NextResponse.redirect(url);
}
