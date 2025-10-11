// app/auth/callback/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/';

  const supabase = supabaseServer();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const to = new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, url.origin);
      return NextResponse.redirect(to);
    }
  }

  const to = new URL(next, url.origin);
  return NextResponse.redirect(to);
}
