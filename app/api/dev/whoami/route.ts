// app/api/dev/whoami/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * Simple diagnostics endpoint to confirm the server-side session.
 * Returns the current user id/email if signed in.
 */
export async function GET() {
  const supabase = supabaseServer();

  const { data, error } = await supabase.auth.getUser();
  const user = data?.user ?? null;

  return NextResponse.json(
    {
      ok: !error,
      user: user ? { id: user.id, email: user.email } : null,
      error: error ? error.message : null,
    },
    { status: error ? 401 : 200 }
  );
}
