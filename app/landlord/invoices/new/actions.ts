'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

type Item = { desc: string; qty: number; price: number };

function toInt(n: unknown, d = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? Math.floor(v) : d;
}

function parseItems(form: FormData): Item[] {
  const descs = form.getAll('desc[]');
  const qtys = form.getAll('qty[]');
  const prices = form.getAll('price[]');

  const rows: Item[] = [];
  const len = Math.max(descs.length, qtys.length, prices.length);
  for (let i = 0; i < len; i++) {
    const desc = String(descs[i] ?? '').trim();
    const qty = toInt(qtys[i]);
    const priceMajor = Number(prices[i] ?? 0); // e.g., 123.45
    const price = Math.round((Number.isFinite(priceMajor) ? priceMajor : 0) * 100); // cents
    if (desc && qty > 0 && price >= 0) rows.push({ desc, qty, price });
  }
  return rows;
}

export async function createInvoice(formData: FormData) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const cookieStore = cookies();

  const supabase = createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set() {},
      remove() {},
    },
  });

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) redirect('/login');

  const intent = (formData.get('intent') as string) || 'draft';
  const currency = ((formData.get('currency') as string) || 'USD').toUpperCase();
  const dueRaw = (formData.get('due_at') as string) || '';
  const dueAt = dueRaw ? new Date(dueRaw + 'T00:00:00Z').toISOString() : null;

  const items = parseItems(formData);
  const taxRate = Math.max(0, Number(formData.get('tax_rate') ?? 0)) / 100; // 0.00–1.00

  let subtotal = 0;
  for (const it of items) subtotal += it.qty * it.price;
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax;

  // Guardrails: cannot issue without items & positive total
  if (intent === 'issue' && (items.length === 0 || total <= 0)) {
    redirect(`/landlord/invoices/new?err=${encodeURIComponent('Add at least one item with a positive total before issuing.')}`);
  }

  // Insert invoice as DRAFT first
  const { data: invIns, error: invErr } = await supabase
    .from('invoices')
    .insert([
      {
        user_id: uid,           // owner for filtering
        status: 'DRAFT',        // start as DRAFT; issue later if requested
        currency,
        due_at: dueAt,
        total,
      },
    ])
    .select('id')
    .single();

  if (invErr || !invIns?.id) {
    redirect(`/landlord/invoices/new?err=${encodeURIComponent(invErr?.message || 'Failed to create invoice')}`);
  }

  const invoiceId = invIns.id as string;

  // Insert items (ignore if none)
  if (items.length > 0) {
    const payload = items.map((it) => ({
      invoice_id: invoiceId,
      description: it.desc,
      quantity: it.qty,
      unit_price: it.price, // cents
    }));
    const { error: itemErr } = await supabase.from('invoice_items').insert(payload);
    if (itemErr) {
      redirect(`/landlord/invoices/new?err=${encodeURIComponent(itemErr.message)}`);
    }
  }

  // If issuing, call RPC to assign number & flip to ISSUED
  if (intent === 'issue') {
    const { error: rpcErr } = await supabase.rpc('issue_invoice', { p_id: invoiceId });
    if (rpcErr) {
      redirect(`/landlord/invoices/new?err=${encodeURIComponent(rpcErr.message)}`);
    }
  }

  revalidatePath('/invoices');
  redirect(`/invoices/${invoiceId}`);
}
