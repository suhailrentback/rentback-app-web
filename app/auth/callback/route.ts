// app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Handles the OAuth / Magic Link return from Supabase.
 * - Extracts `code` from the URL
 * - Exchanges it for a session (sets auth cookies via our SSR client)
 * - Redirects to `next` (or `/` as a fallback)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/';

  const supabase = createSupabaseServerClient();

  // Missing code — bounce back to sign-in with an error message
  if (!code) {
    const to = new URL(
      `/sign-in?error=${encodeURIComponent('Missing auth code')}`,
      process.env.NEXT_PUBLIC_SITE_URL || url.origin
    );
    return NextResponse.redirect(to);
  }

  // Exchange the code for a session (sets cookies through the SSR client)
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const to = new URL(
      `/sign-in?error=${encodeURIComponent(error.message)}`,
      process.env.NEXT_PUBLIC_SITE_URL || url.origin
    );
    return NextResponse.redirect(to);
  }

  // Success — go to the requested destination
  const to = new URL(next, process.env.NEXT_PUBLIC_SITE_URL || url.origin);
  return NextResponse.redirect(to);
}
