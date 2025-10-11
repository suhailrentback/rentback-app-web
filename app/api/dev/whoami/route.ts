// app/api/dev/whoami/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase/server';

export async function GET() {
  const supabase = supabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  let role: string | null = null;
  if (user) {
    const { data: prof } = await supabase
      .from('Profile')
      .select('role,email')
      .eq('id', user.id)
      .limit(1)
      .single();
    role = prof?.role || null;
  }

  return NextResponse.json({
    ok: !error,
    user: user ? { id: user.id, email: user.email } : null,
    role,
    error: error?.message || null,
  });
}
