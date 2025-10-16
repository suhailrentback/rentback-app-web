// app/api/auth/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'nodejs';

async function getServerSupabase(req: NextRequest, res: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options?: Parameters<typeof res.cookies.set>[2]) {
          res.cookies.set(name, value, { path: '/', ...(options || {}) });
        },
        remove(name: string, options?: Parameters<typeof res.cookies.set>[2]) {
          res.cookies.set(name, '', { path: '/', ...(options || {}), maxAge: 0 });
        },
      },
    }
  );
}

// Accept POST (or GET) to keep it easy to call
export async function POST(req: NextRequest) {
  const pass = NextResponse.next(); // to capture any cookie writes
  const supabase = await getServerSupabase(req, pass);

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ ok: false, error: userErr?.message || 'Unauthenticated' }, { status: 401, headers: pass.headers });
  }

  const email = user.email ?? null;

  // Do we have a profile row already?
  const { data: existing, error: selErr } = await supabase
    .from('profiles')
    .select('id, role, email')
    .eq('id', user.id)
    .maybeSingle();

  if (selErr) {
    return NextResponse.json({ ok: false, error: selErr.message }, { status: 400, headers: pass.headers });
  }

  // If none → insert with default role=tenant
  if (!existing) {
    const { data: inserted, error: insErr } = await supabase
      .from('profiles')
      .insert([{ id: user.id, email, role: 'tenant' }])
      .select('id, role, email')
      .single();

    if (insErr) {
      return NextResponse.json({ ok: false, error: insErr.message }, { status: 400, headers: pass.headers });
    }

    return NextResponse.json({ ok: true, profile: inserted }, { headers: pass.headers });
  }

  // If exists but no role → set tenant
  if (!existing.role) {
    const { data: updated, error: updErr } = await supabase
      .from('profiles')
      .update({ role: 'tenant' })
      .eq('id', user.id)
      .select('id, role, email')
      .single();

    if (updErr) {
      return NextResponse.json({ ok: false, error: updErr.message }, { status: 400, headers: pass.headers });
    }

    return NextResponse.json({ ok: true, profile: updated }, { headers: pass.headers });
  }

  // Already good
  return NextResponse.json({ ok: true, profile: existing }, { headers: pass.headers });
}

// Optional GET for easy manual tests
export async function GET(req: NextRequest) {
  return POST(req);
}
