// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function GET() {
  const c = cookies();
  const lang = c.get('rb_lang')?.value ?? null;

  const info = {
    ok: true,
    app: 'rentback-app-web',
    time: new Date().toISOString(),
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    node: process.version,
    supabase: {
      urlPresent: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKeyPresent: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRolePresent: !!process.env.SUPABASE_SERVICE_ROLE_KEY, // may be false, that’s OK
    },
    langCookie: lang,
  };

  return NextResponse.json(info, { status: 200 });
}
