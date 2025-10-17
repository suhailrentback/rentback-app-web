// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareSupabase } from '@/lib/supabase/middleware';

const PUBLIC_PATHS = new Set<string>([
  '/',
  '/sign-in',
  '/auth/callback',
  '/api/health',
  '/api/auth/sync',
  '/favicon.ico',
  '/debug/status',
]);

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  // allow static assets & _next
  if (pathname.startsWith('/_next/') || pathname.startsWith('/assets/')) return true;
  return false;
}

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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const { supabase, res } = createMiddlewareSupabase(req);

  // Public pages are always OK
  if (isPublic(pathname)) return res;

  // Get session (edge-safe)
  const { data: { session } } = await supabase.auth.getSession();

  // If unauthenticated and trying to access protected area -> go to sign-in
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = '/sign-in';
    url.searchParams.set('next', pathname || '/');
    return NextResponse.redirect(url);
  }

  // Determine role from cookie first
  let role = req.cookies.get('rb_role')?.value ?? null;

  // Fallback to DB profile if cookie missing/stale
  if (!role) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      role = data?.role ?? null;

      // If no row yet, default to tenant and let /api/auth/sync upsert later
      if (!role) role = 'tenant';

      // refresh cookie
      res.cookies.set({
        name: 'rb_role',
        value: role,
        path: '/',
        sameSite: 'lax',
        httpOnly: true,
        secure: true,
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    } catch {
      // do nothing; role stays null -> treated as tenant
      role = 'tenant';
    }
  }

  // Role-based path gating
  const wantsTenant = pathname.startsWith('/tenant');
  const wantsLandlord = pathname.startsWith('/landlord');
  const wantsAdmin = pathname.startsWith('/admin');

  if (wantsTenant && role !== 'tenant') {
    const url = req.nextUrl.clone();
    url.pathname = pathForRole(role);
    return NextResponse.redirect(url);
  }
  if (wantsLandlord && role !== 'landlord') {
    const url = req.nextUrl.clone();
    url.pathname = pathForRole(role);
    return NextResponse.redirect(url);
  }
  if (wantsAdmin && role !== 'staff' && role !== 'admin') {
    const url = req.nextUrl.clone();
    url.pathname = pathForRole(role);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ['/((?!.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif)$).*)'],
};
