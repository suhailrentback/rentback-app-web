import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteSupabase } from '@/lib/supabase/server';

// keep runtime Node for PDF/fontkit compatibility elsewhere
export const runtime = 'nodejs';

const Body = z.object({
  tenant_email: z.string().email(),
  description: z.string().min(1).max(200),
  amount: z.number().finite().nonnegative(), // PKR units, e.g. 25000
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
});

export async function POST(req: Request) {
  const supabase = createRouteSupabase();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // landlord check via profiles (RLS will also enforce)
  const { data: me } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (!me || me.role !== 'landlord') {
    return NextResponse.json({ error: 'Only landlord can create invoices' }, { status: 403 });
  }

  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch (e: any) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  // resolve tenant by email
  const { data: tenant, error: tenantErr } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', parsed.tenant_email)
    .maybeSingle();

  if (tenantErr || !tenant?.id) {
    return NextResponse.json({ error: 'Tenant not found for that email' }, { status: 404 });
  }

  // construct insert
  const amountCents = Math.round(parsed.amount * 100);
  const number = `INV-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

  const { data: created, error: insErr } = await supabase
    .from('invoices')
    .insert({
      tenant_id: tenant.id,
      status: 'open', // matches current check constraint
      issued_at: new Date().toISOString(),
      due_date: parsed.due_date,
      amount_cents: amountCents,
      total_amount: parsed.amount,
      currency: 'PKR',
      description: parsed.description,
      number,
    })
    .select('id, number')
    .maybeSingle();

  if (insErr || !created?.id) {
    return NextResponse.json({ error: insErr?.message ?? 'Failed to create invoice' }, { status: 500 });
  }

  return NextResponse.json({ id: created.id, number: created.number });
}
