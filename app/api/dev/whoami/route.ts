// app/api/dev/whoami/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return NextResponse.json({
    ok: true,
    user: user ? {
      id: user.id,
      email: user.email,
      confirmed: user.email_confirmed_at,
    } : null,
  });
}
