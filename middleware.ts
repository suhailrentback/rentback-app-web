// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { ROLE_COOKIE, pathAllowedForRole, roleToHome, type Role } from '@/lib/auth/roles';
import { createServerClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const PROTECTED_PREFIXES = ['/tenant', '/landlord', '/admin'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard protected sections
  if (!PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 1) Fast path: cookie
  const cookieRole = (req.cookies.get(ROLE_COOKIE)?.value as Role | undefined) || undefined;
  if (cookieRole) {
    if (pathAllowedForRole(pathname, cookieRole)) {
      return NextResponse.next();
    }
    // Role present but wrong area → not permitted
    const res = NextResponse.redirect(new URL('/not-permitted', req.url));
    return res;
  }

  // 2) Slow path: check Supabase once (also refresh cookie)
  const res = NextResponse.next();
  const supabase = createServerClient(url, anon, {
    cookies: {
      get(name) {
        return req.cookies.get(name)?.value;
      },
      set(name, value, options) {
        res.cookies.set({ name, value, ...(options || {}) });
      },
      remove(name, options) {
        res.cookies.set({ name, value: '', ...(options || {}), maxAge: 0 });
      },
    },
    global: { fetch },
  });

  // Make sure we have a session at all
  const { data: { user } = { user: null } } = await supabase.auth.getUser();
  if (!user) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Fetch role from profiles; avoid chaining .catch on the builder
  let role: Role | null = null;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    role = (data?.role as Role | null) ?? null;
  } catch {
    role = null;
  }

  // If still missing, default to tenant and persist (first-sign-in safety)
  if (!role) {
    role = (user.email?.toLowerCase().endsWith('@rentback.app') ? 'staff' : 'tenant') as Role;
    try {
      await supabase.from('profiles').upsert(
        { id: user.id, email: user.email, role },
        { onConflict: 'id' }
      );
    } catch {
      // ignore
    }
  }

  // Set/refresh short-lived role cookie
  res.cookies.set(ROLE_COOKIE, role, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 20,
  });

  // Final access check
  if (pathAllowedForRole(pathname, role)) {
    return res;
  }

  // Wrong area → send them to their home
  const redirectUrl = new URL(roleToHome(role), req.url);
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    '/tenant/:path*',
    '/landlord/:path*',
    '/admin/:path*',
  ],
};
