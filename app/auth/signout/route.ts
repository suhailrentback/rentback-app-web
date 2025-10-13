// WEB: app/auth/sign-out/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  await supabase.auth.signOut();
  const url = new URL(request.url);
  return NextResponse.redirect(new URL('/', url.origin));
}
