import { NextResponse, NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/tenant', '/landlord', '/admin'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard protected sections for session presence.
  if (!PROTECTED_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Supabase sets sb-access-token cookie when authenticated
  const hasSession = Boolean(req.cookies.get('sb-access-token')?.value);
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/sign-in';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/tenant/:path*', '/landlord/:path*', '/admin/:path*'],
};
