import Link from 'next/link';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { updateDraftInvoice } from '@/app/actions/invoices';

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

export default async function EditDraftInvoicePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = getSb();
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, number, status, due_at, currency, total, created_at')
    .eq('id', params.id)
    .single();

  if (!invoice) {
    return (
      <section className="p-6">
        <div className="text-sm opacity-70">Invoice not found.</div>
      </section>
    );
  }

  if (invoice.status !== 'DRAFT') {
    return (
      <section className="p-6 space-y-4">
        <div className="rounded-xl border px-4 py-3 text-sm bg-amber-500/10 border-amber-300/60 dark:border-amber-500/40">
          Only <b>draft</b> invoices can be edited.
        </div>
        <Link
          href={`/invoices/${invoice.id}`}
          className="inline-block rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10"
        >
          Back to Invoice
        </Link>
      </section>
    );
  }

  const { data: items } = await supabase
    .from('invoice_items')
    .select('id, description, quantity, unit_price')
    .eq('invoice_id', invoice.id)
    .order('id', { ascending: true });

  const error = (searchParams?.error as string) || '';
  const success = (searchParams?.success as string) || '';

  // Show existing items and a few blank rows (cap at 10)
  const existing = items || [];
  const totalRows = Math.min(Math.max(existing.length + 3, 5), 10);
  const indices = Array.from({ length: totalRows }, (_, i) => i + 1);

  return (
    <section className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Edit Draft</h1>
          <div className="text-xs opacity-70">
            {invoice.number ?? 'Draft'} • Created:{' '}
            {invoice.created_at
              ? new Date(invoice.created_at).toLocaleDateString()
              : '—'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/invoices/${invoice.id}`}
            className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            Back
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-300/60 dark:border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-300/60 dark:border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm">
          {success}
        </div>
      ) : null}

      <form action={updateDraftInvoice} className="space-y-6">
        <input type="hidden" name="id" value={invoice.id} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-xs opacity-70">Due date</span>
            <input
              type="date"
              name="due_at"
              defaultValue={invoice.due_at ? new Date(invoice.due_at).toISOString().slice(0, 10) : ''}
              className="mt-1 w-full rounded-xl border px-3 py-2 bg-transparent"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs opacity-70">Currency</span>
            <input
              type="text"
              name="currency"
              defaultValue={(invoice.currency || 'USD').toUpperCase()}
              className="mt-1 w-full rounded-xl border px-3 py-2 bg-transparent uppercase"
            />
          </label>
        </div>

        <div className="space-y-3">
          <div className="font-medium">Line items</div>

          {indices.map((i) => {
            const cur = existing[i - 1];
            return (
              <div
                key={i}
                className="grid grid-cols-1 md:grid-cols-6 gap-3 rounded-2xl border p-3"
              >
                <label className="md:col-span-3">
                  <span className="text-xs opacity-70">Description</span>
                  <input
                    type="text"
                    name={`item${i}_desc`}
                    defaultValue={cur?.description || ''}
                    placeholder="e.g., Monthly Rent"
                    className="mt-1 w-full rounded-xl border px-3 py-2 bg-transparent"
                  />
                </label>
                <label>
                  <span className="text-xs opacity-70">Qty</span>
                  <input
                    type="number"
                    min={0}
                    name={`item${i}_qty`}
                    defaultValue={cur?.quantity ?? ''}
                    className="mt-1 w-full rounded-xl border px-3 py-2 bg-transparent"
                  />
                </label>
                <label className="md:col-span-2">
                  <span className="text-xs opacity-70">Unit price (major)</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    name={`item${i}_price`}
                    defaultValue={
                      cur?.unit_price != null ? (cur.unit_price / 100).toFixed(2) : ''
                    }
                    className="mt-1 w-full rounded-xl border px-3 py-2 bg-transparent"
                  />
                </label>
              </div>
            );
          })}

          <div className="text-xs opacity-70">
            Leave blank rows empty. Maximum 10 items per invoice.
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-2xl px-4 py-2 border font-medium hover:bg-black/5 dark:hover:bg-white/10"
          >
            Save Changes
          </button>
          <span className="text-xs opacity-60">You can issue after saving.</span>
        </div>
      </form>
    </section>
  );
}
