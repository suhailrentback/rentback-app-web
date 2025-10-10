// app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get('next') || '/';
  const supabase = supabaseServer();

  // Exchange the auth code in the URL for a session and set cookies
  const { error } = await supabase.auth.exchangeCodeForSession(url.searchParams);
  if (error) {
    const to = new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, process.env.NEXT_PUBLIC_SITE_URL || url.origin);
    return NextResponse.redirect(to);
  }

  // Back to the app (or /tenant later when we add guards)
  const to = new URL(next, process.env.NEXT_PUBLIC_SITE_URL || url.origin);
  return NextResponse.redirect(to);
}
