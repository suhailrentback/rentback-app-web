// app/api/landlord/invoices/[id]/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteSupabase } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/server/audit';

export const runtime = 'nodejs';

const UpdateInvoice = z.object({
  // All fields optional; only provided ones are updated.
  number: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),     // major units
  currency: z.string().min(1).optional(),
  dueDate: z.string().datetime().or(z.string().min(1)).optional(),
  status: z.enum(['open', 'paid']).optional(),  // current lifecycle
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteSupabase();
  const { id } = params;

  let payload: z.infer<typeof UpdateInvoice>;
  try {
    payload = UpdateInvoice.parse(await req.json());
  } catch (_e) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  // Build update object from provided fields only
  const update: Record<string, any> = {};
  if (payload.number) update.number = payload.number;
  if (payload.description) update.description = payload.description;
  if (payload.currency) update.currency = payload.currency;
  if (payload.status) update.status = payload.status;
  if (payload.dueDate) update.due_date = new Date(payload.dueDate).toISOString();
  if (typeof payload.amount === 'number') {
    update.total_amount = payload.amount;
    update.amount_cents = Math.round(payload.amount * 100);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'nothing_to_update' }, { status: 400 });
  }

  const { data: updated, error: updErr } = await supabase
    .from('invoices')
    .update(update)
    .eq('id', id)
    .select('id, number, status')
    .maybeSingle();

  if (updErr || !updated) {
    return NextResponse.json({ error: 'update_failed' }, { status: 400 });
  }

  // Audit (best-effort)
  await writeAuditLog({
    supabase,
    entityTable: 'invoices',
    entityId: updated.id,
    action: 'invoice.update',
    metadata: update,
  });

  return NextResponse.json({ ok: true, id: updated.id, number: updated.number, status: updated.status });
}
