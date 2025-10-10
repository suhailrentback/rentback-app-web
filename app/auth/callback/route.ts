// app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Handles the OAuth / Magic Link return from Supabase.
 * - Extracts `code` from the URL
 * - Exchanges it for a session (sets auth cookies)
 * - Redirects to `next` (or `/`)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/';

  const supabase = createSupabaseServerClient();

  if (!code) {
    const to = new URL(
      `/sign-in?error=${encodeURIComponent('Missing auth code')}`,
      process.env.NEXT_PUBLIC_SITE_URL || url.origin
    );
    return NextResponse.redirect(to);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const to = new URL(
      `/sign-in?error=${encodeURIComponent(error.message)}`,
      process.env.NEXT_PUBLIC_SITE_URL || url.origin
    );
    return NextResponse.redirect(to);
  }

  const to = new URL(next, process.env.NEXT_PUBLIC_SITE_URL || url.origin);
  return NextResponse.redirect(to);
}
