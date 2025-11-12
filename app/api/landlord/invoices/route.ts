// app/api/landlord/invoices/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteSupabase } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/server/audit';

export const runtime = 'nodejs';

const CreateInvoice = z.object({
  tenantEmail: z.string().email(),
  number: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().positive(),           // e.g., 25000 (major units)
  currency: z.string().min(1),             // e.g., 'PKR'
  dueDate: z.string().datetime().or(z.string().min(1)), // ISO or simple date
  issuedAt: z.string().datetime().optional(),          // optional ISO
});

export async function POST(req: Request) {
  const supabase = createRouteSupabase();

  let payload: z.infer<typeof CreateInvoice>;
  try {
    payload = CreateInvoice.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  // Lookup tenant by email from profiles
  const { data: tenant, error: lookupErr } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', payload.tenantEmail.toLowerCase())
    .maybeSingle();

  if (lookupErr || !tenant) {
    return NextResponse.json({ error: 'profile_not_found' }, { status: 404 });
  }

  // Prepare row
  const amount_cents = Math.round(payload.amount * 100);
  const issued_at = payload.issuedAt ?? new Date().toISOString();
  const due_date = new Date(payload.dueDate).toISOString();

  const insertRow = {
    tenant_id: tenant.id,
    status: 'open',
    issued_at,
    due_date,
    amount_cents,
    total_amount: payload.amount,
    currency: payload.currency,
    description: payload.description,
    number: payload.number,
  };

  const { data: inserted, error: insertErr } = await supabase
    .from('invoices')
    .insert(insertRow)
    .select('id, number')
    .single();

  if (insertErr || !inserted) {
    return NextResponse.json({ error: 'insert_failed' }, { status: 400 });
  }

  // Audit (best-effort)
  await writeAuditLog({
    supabase,
    entityTable: 'invoices',
    entityId: inserted.id,
    action: 'invoice.create',
    metadata: {
      number: inserted.number,
      tenantEmail: tenant.email,
      amount: payload.amount,
      currency: payload.currency,
      dueDate: due_date,
      issuedAt: issued_at,
    },
  });

  return NextResponse.json({ ok: true, id: inserted.id, number: inserted.number });
}
