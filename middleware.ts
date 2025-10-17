// middleware.ts
import { NextResponse, NextRequest } from 'next/server';

const MATCH = ['/tenant', '/landlord', '/admin'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsGuard = MATCH.some((m) => pathname === m || pathname.startsWith(m + '/'));
  if (!needsGuard) return NextResponse.next();

  const role = req.cookies.get('rb_role')?.value as 'tenant' | 'landlord' | 'staff' | undefined;
  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = '/sign-in';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Role-based gates
  if (pathname.startsWith('/tenant')) {
    if (role === 'tenant' || role === 'staff') return NextResponse.next();
  } else if (pathname.startsWith('/landlord')) {
    if (role === 'landlord' || role === 'staff') return NextResponse.next();
  } else if (pathname.startsWith('/admin')) {
    if (role === 'staff') return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = '/not-permitted';
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/tenant/:path*', '/landlord/:path*', '/admin/:path*'],
};
