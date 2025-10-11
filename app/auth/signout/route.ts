// app/auth/signout/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = supabaseServer();
  await supabase.auth.signOut();
  const url = new URL('/', request.url);
  return NextResponse.redirect(url);
}
