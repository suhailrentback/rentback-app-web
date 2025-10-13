// WEB /app/api/dev/whoami/route.ts
import { NextResponse } from 'next/server';
import { supabaseRoute } from '../../../../lib/supabase/server';

export async function GET() {
  const supabase = supabaseRoute();
  const { data: { user } } = await supabase.auth.getUser();
  return NextResponse.json(
    user ? { id: user.id, email: user.email } : { user: null }
  );
}
