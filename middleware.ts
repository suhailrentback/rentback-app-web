// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PUBLIC = [
  '/', '/sign-in', '/auth/callback', '/not-permitted',
  '/api/auth/sync', '/api/health', '/debug/status',
];
function isPublic(path: string) {
  if (path.startsWith('/_next') || path.startsWith('/favicon') || path.startsWith('/assets')) return true;
  return PUBLIC.some(p => path === p || path.startsWith(p + '/'));
}

// Route rules: who can enter which sections
const RULES: Array<{ prefix: string; allow: string[] }> = [
  { prefix: '/tenant',   allow: ['tenant', 'landlord', 'staff', 'admin'] },
  { prefix: '/landlord', allow: ['landlord', 'staff', 'admin'] },
  { prefix: '/admin',    allow: ['staff', 'admin'] },
];

function neededRoleFor(pathname: string): string[] | null {
  for (const r of RULES) if (pathname.startsWith(r.prefix)) return r.allow;
  return null; // no special protection
}

function makeSupabase(req: NextRequest, res: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return req.cookies.get(name)?.value; },
        set(name: string, value: string, options?: Parameters<typeof res.cookies.set>[2]) {
          res.cookies.set(name, value, { path: '/', ...(options || {}) });
        },
        remove(name: string, options?: Parameters<typeof res.cookies.set>[2]) {
          res.cookies.set(name, '', { path: '/', ...(options || {}), maxAge: 0 });
        },
      },
    }
  );
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const res = NextResponse.next();
  const supabase = makeSupabase(req, res);

  // 1) Must be signed in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const url = new URL('/sign-in', req.url);
    url.searchParams.set('next', pathname + search);
    return NextResponse.redirect(url, { headers: res.headers });
  }

  // 2) Determine required roles for this path
  const allow = neededRoleFor(pathname);
  if (!allow) return res; // no role requirement for this path

  // 3) Read role from profiles; if missing, create a default = 'tenant'
  let role: string | null = null;

  const { data: existing } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .maybeSingle();

  role = existing?.role ?? null;

  if (!role) {
    // Create on the fly (RLS allows insert when auth.uid() = id)
    const { data: upserted } = await supabase
      .from('profiles')
      .upsert({ id: user.id, email: user.email, role: 'tenant' }, { onConflict: 'id' })
      .select('role')
      .single()
      .catch(() => ({ data: null as any }));

    role = upserted?.role ?? null;
  }

  // 4) Final check
  if (!role || !allow.includes(role)) {
    return NextResponse.redirect(new URL('/not-permitted', req.url), { headers: res.headers });
  }

  return res;
}

// Apply to everything except obvious static stuff
export const config = {
  matcher: ['/((?!_next|favicon.ico|robots.txt|sitemap.xml).*)'],
};
