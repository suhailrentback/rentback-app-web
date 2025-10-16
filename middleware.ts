// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PROTECTED_PREFIXES = ['/tenant']; // expand later if needed

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Ignore static files and public paths
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return res;

  // Supabase client on the Edge (middleware)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options?: Parameters<typeof res.cookies.set>[2]) {
          res.cookies.set(name, value, { path: '/', ...(options || {}) });
        },
        remove(name: string, options?: Parameters<typeof res.cookies.set>[2]) {
          res.cookies.set(name, '', { path: '/', ...(options || {}), maxAge: 0 });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // If not signed in, bounce to sign-in and keep the destination
  if (!user) {
    const url = new URL('/sign-in', req.url);
    url.searchParams.set('next', pathname || '/tenant');
    return NextResponse.redirect(url);
  }

  // TEMP: we’re not checking roles here to avoid false /not-permitted.
  return res;
}

// Only run on non-static routes
export const config = {
  matcher: [
    // Skip Next internals and files with extensions
    '/((?!_next/|api/health|api/dev/|favicon.ico|robots.txt|sitemap.xml|.*\\.).*)',
  ],
};
