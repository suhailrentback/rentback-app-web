// WEB /app/sign-out/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies });
  await supabase.auth.signOut();
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://rentback.app';
  return NextResponse.redirect(new URL('/', base));
}
