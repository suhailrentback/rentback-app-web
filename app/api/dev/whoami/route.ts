// app/api/dev/whoami/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // Build a response we can mutate cookies on (required by SSR client)
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // pull from request cookies
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

  const { data: { user }, error } = await supabase.auth.getUser();

  return NextResponse.json(
    {
      ok: !error,
      error: error?.message ?? null,
      user: user
        ? {
            id: user.id,
            email: user.email,
            app_metadata: user.app_metadata,
            user_metadata: user.user_metadata,
          }
        : null,
    },
    { status: error ? 401 : 200, headers: res.headers }
  );
}
