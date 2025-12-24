'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect, notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';

type Status = 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE';

function getSb() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set() {},
      remove() {},
    },
  });
}

function toCents(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v.toString().replace(/[^0-9.\-]/g, ''));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

/** Create invoice with up to 3 line items. */
export async function createInvoice(formData: FormData) {
  const supabase = getSb();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) redirect('/login');

  const due = formData.get('due_at') as string | null;
  const currency = ((formData.get('currency') as string) || 'USD').toUpperCase();

  // Insert invoice as DRAFT
  const { data: inv, error: insErr } = await supabase
    .from('invoices')
    .insert({
      user_id: uid,
      status: 'DRAFT' as Status,
      due_at: due ? new Date(due).toISOString() : null,
      currency,
    })
    .select('id')
    .single();

  if (insErr || !inv) {
    console.error(insErr);
    throw new Error('Failed to create invoice');
  }

  // Gather up to 3 item rows
  const rows: Array<{ description: string; quantity: number; unit_price: number }> = [];
  for (let i = 1; i <= 3; i++) {
    const desc = (formData.get(`item${i}_desc`) as string) || '';
    const qty = Number(formData.get(`item${i}_qty`) || 0);
    const priceCents = toCents(formData.get(`item${i}_price`) as string | null) ?? 0;
    if (desc.trim() && qty > 0 && priceCents > 0) {
      rows.push({ description: desc.trim(), quantity: qty, unit_price: priceCents });
    }
  }

  if (rows.length) {
    const { error: itemErr } = await supabase
      .from('invoice_items')
      .insert(rows.map(r => ({ ...r, invoice_id: inv.id })));
    if (itemErr) {
      console.error(itemErr);
      // don’t abort; still allow navigating to the draft shell
    }
  }

  // Optional: set total now (DB trigger can also handle it)
  const { data: totals } = await supabase
    .from('invoice_items')
    .select('quantity,unit_price')
    .eq('invoice_id', inv.id);

  if (totals && totals.length) {
    const total =
      totals.reduce((sum, r) => sum + (r.quantity || 0) * (r.unit_price || 0), 0) || null;
    await supabase.from('invoices').update({ total }).eq('id', inv.id);
  }

  revalidatePath('/invoices');
  redirect(`/invoices/${inv.id}`);
}

/** Issue: set status, and if number missing, assign INV-YYYYMMDD-xxxxx */
export async function issueInvoice(formData: FormData) {
  const supabase = getSb();
  const id = formData.get('id') as string | null;
  if (!id) notFound();

  // Fetch current to ensure ownership + get number
  const { data: inv, error } = await supabase
    .from('invoices')
    .select('id, number, status')
    .eq('id', id)
    .single();
  if (error || !inv) notFound();

  // Create a human-friendly number if none exists
  let number = inv.number as string | null;
  if (!number) {
    const today = new Date();
    const ymd = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('');
    const short = crypto.randomUUID().slice(0, 5);
    number = `INV-${ymd}-${short}`;
  }

  await supabase
    .from('invoices')
    .update({ status: 'ISSUED' as Status, number })
    .eq('id', id);

  revalidatePath(`/invoices/${id}`);
  revalidatePath('/invoices');
  redirect(`/invoices/${id}`);
}

/** Mark as PAID. */
export async function markInvoicePaid(formData: FormData) {
  const supabase = getSb();
  const id = formData.get('id') as string | null;
  if (!id) notFound();

  await supabase
    .from('invoices')
    .update({ status: 'PAID' as Status })
    .eq('id', id);

  revalidatePath(`/invoices/${id}`);
  revalidatePath('/invoices');
  redirect(`/invoices/${id}`);
}
