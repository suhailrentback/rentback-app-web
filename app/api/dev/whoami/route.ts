import { NextResponse } from 'next/server';
import { createRouteSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = await createRouteSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  let role: string | null = null;
  if (user?.id) {
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    role = data?.role ?? null;
  }
  return NextResponse.json({ user: user ? { id: user.id, email: user.email } : null, role });
}
