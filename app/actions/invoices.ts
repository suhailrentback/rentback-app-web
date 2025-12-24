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

function safeCurrency(input: string | null | undefined): string {
  const c = (input || 'USD').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(c) ? c : 'USD';
}

function parseDue(dueRaw: string | null | undefined) {
  if (!dueRaw) return null;
  const d = new Date(dueRaw);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function redirectWith(path: string, params: Record<string, string | undefined | null>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') usp.set(k, v);
  }
  redirect(`${path}?${usp.toString()}`);
}

/** Create invoice with up to 3 line items. (Wave 9.2 + 9.8 validation) */
export async function createInvoice(formData: FormData) {
  const supabase = getSb();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) redirect('/login');

  const dueAt = parseDue(formData.get('due_at') as string | null);
  const currency = safeCurrency(formData.get('currency') as string | null);

  // Validation
  if (!dueAt) {
    redirectWith('/landlord/invoices/new', { error: 'Please provide a valid due date.' });
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dueAt! < today) {
    redirectWith('/landlord/invoices/new', { error: 'Due date cannot be in the past.' });
  }

  // Collect up to 3 rows
  const rows: Array<{ description: string; quantity: number; unit_price: number }> = [];
  for (let i = 1; i <= 3; i++) {
    const desc = (formData.get(`item${i}_desc`) as string) || '';
    const qty = Number(formData.get(`item${i}_qty`) || 0);
    const priceCents = toCents(formData.get(`item${i}_price`) as string | null) ?? 0;
    if (desc.trim() && qty > 0 && priceCents > 0) {
      rows.push({ description: desc.trim(), quantity: qty, unit_price: priceCents });
    }
  }
  if (rows.length === 0) {
    redirectWith('/landlord/invoices/new', { error: 'Add at least one valid line item.' });
  }

  // Insert invoice as DRAFT
  const { data: inv, error: insErr } = await supabase
    .from('invoices')
    .insert({
      user_id: uid,
      status: 'DRAFT' as Status,
      due_at: dueAt!.toISOString(),
      currency,
    })
    .select('id')
    .single();
  if (insErr || !inv) {
    redirectWith('/landlord/invoices/new', { error: 'Failed to create invoice. Try again.' });
  }

  // Insert items
  const { error: itemErr } = await supabase
    .from('invoice_items')
    .insert(rows.map((r) => ({ ...r, invoice_id: inv!.id })));
  if (itemErr) {
    redirectWith('/landlord/invoices/new', { error: 'Failed to save line items.' });
  }

  // Recalc total
  const { data: totals } = await supabase
    .from('invoice_items')
    .select('quantity,unit_price')
    .eq('invoice_id', inv!.id);
  const total =
    (totals || []).reduce((sum, r) => sum + (r.quantity || 0) * (r.unit_price || 0), 0) || null;
  await supabase.from('invoices').update({ total }).eq('id', inv!.id);

  revalidatePath('/invoices');
  redirect(`/invoices/${inv!.id}?success=Draft%20created`);
}

/** Issue: set status, and if number missing, assign INV-YYYYMMDD-xxxxx */
export async function issueInvoice(formData: FormData) {
  const supabase = getSb();
  const id = formData.get('id') as string | null;
  if (!id) notFound();

  const { data: inv } = await supabase
    .from('invoices')
    .select('id, number, status')
    .eq('id', id)
    .single();
  if (!inv) notFound();

  let number = inv.number as string | null;
  if (!number) {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const short = crypto.randomUUID().slice(0, 5);
    number = `INV-${y}${m}${d}-${short}`;
  }

  await supabase.from('invoices').update({ status: 'ISSUED' as Status, number }).eq('id', id);

  revalidatePath(`/invoices/${id}`);
  revalidatePath('/invoices');
  redirect(`/invoices/${id}?success=Invoice%20issued`);
}

/** Mark as PAID. */
export async function markInvoicePaid(formData: FormData) {
  const supabase = getSb();
  const id = formData.get('id') as string | null;
  if (!id) notFound();

  await supabase.from('invoices').update({ status: 'PAID' as Status }).eq('id', id);

  revalidatePath(`/invoices/${id}`);
  revalidatePath('/invoices');
  redirect(`/invoices/${id}?success=Marked%20paid`);
}

/** 9.9 Edit DRAFT: replace items, update due/currency, recalc total. */
export async function updateDraftInvoice(formData: FormData) {
  const supabase = getSb();
  const id = (formData.get('id') as string) || '';
  if (!id) notFound();

  const dueAt = parseDue(formData.get('due_at') as string | null);
  const currency = safeCurrency(formData.get('currency') as string | null);

  if (!dueAt) {
    redirectWith(`/landlord/invoices/${id}/edit`, { error: 'Please provide a valid due date.' });
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dueAt! < today) {
    redirectWith(`/landlord/invoices/${id}/edit`, { error: 'Due date cannot be in the past.' });
  }

  // Ensure it's a DRAFT and belongs to user (RLS will also guard)
  const { data: inv } = await supabase
    .from('invoices')
    .select('id,status')
    .eq('id', id)
    .maybeSingle();
  if (!inv) notFound();
  if (inv.status !== 'DRAFT') {
    redirectWith(`/invoices/${id}`, { error: 'Only drafts can be edited.' });
  }

  // Parse up to 10 rows; we rebuild items (simple & safe)
  const rows: Array<{ description: string; quantity: number; unit_price: number }> = [];
  for (let i = 1; i <= 10; i++) {
    const desc = (formData.get(`item${i}_desc`) as string) || '';
    const qty = Number(formData.get(`item${i}_qty`) || 0);
    const priceCents = toCents(formData.get(`item${i}_price`) as string | null) ?? 0;
    if (desc.trim() && qty > 0 && priceCents > 0) {
      rows.push({ description: desc.trim(), quantity: qty, unit_price: priceCents });
    }
  }
  if (rows.length === 0) {
    redirectWith(`/landlord/invoices/${id}/edit`, { error: 'Add at least one valid line item.' });
  }

  // Update invoice basics
  await supabase
    .from('invoices')
    .update({ due_at: dueAt!.toISOString(), currency })
    .eq('id', id);

  // Replace items
  await supabase.from('invoice_items').delete().eq('invoice_id', id);
  const { error: itemErr } = await supabase
    .from('invoice_items')
    .insert(rows.map((r) => ({ ...r, invoice_id: id })));
  if (itemErr) {
    redirectWith(`/landlord/invoices/${id}/edit`, { error: 'Failed to save line items.' });
  }

  // Recalc total
  const { data: totals } = await supabase
    .from('invoice_items')
    .select('quantity,unit_price')
    .eq('invoice_id', id);
  const total =
    (totals || []).reduce((sum, r) => sum + (r.quantity || 0) * (r.unit_price || 0), 0) || null;
  await supabase.from('invoices').update({ total }).eq('id', id);

  revalidatePath(`/invoices/${id}`);
  revalidatePath('/invoices');
  redirect(`/landlord/invoices/${id}/edit?success=Saved`);
}
