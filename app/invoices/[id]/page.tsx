import Link from 'next/link';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { issueInvoice, markInvoicePaid } from '@/app/actions/invoices';

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

function money(c: string | null, cents: number | null) {
  if (cents == null) return '—';
  const major = (cents / 100).toFixed(2);
  return `${(c || 'USD').toUpperCase()} ${major}`;
}

export default async function InvoiceDetail({
  params,
}: {
  params: { id: string };
}) {
  const supabase = getSb();

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('id, number, status, due_at, total, currency, created_at')
    .eq('id', params.id)
    .single();

  if (error || !invoice) {
    return (
      <section className="p-6">
        <div className="text-sm opacity-70">Invoice not found.</div>
      </section>
    );
  }

  const { data: items } = await supabase
    .from('invoice_items')
    .select('id, description, quantity, unit_price')
    .eq('invoice_id', invoice.id)
    .order('id', { ascending: true });

  const canIssue = invoice.status === 'DRAFT';
  const canMarkPaid = invoice.status === 'ISSUED' || invoice.status === 'OVERDUE';
  const canPdf = invoice.status === 'ISSUED' || invoice.status === 'PAID';

  return (
    <section className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {invoice.number ?? 'Draft Invoice'}
          </h1>
          <div className="text-xs opacity-70">
            Status: {invoice.status} • Created:{' '}
            {invoice.created_at
              ? new Date(invoice.created_at).toLocaleDateString()
              : '—'}{' '}
            • Due:{' '}
            {invoice.due_at ? new Date(invoice.due_at).toLocaleDateString() : '—'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/invoices"
            className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            Back
          </Link>

          {canPdf ? (
            <a
              href={`/api/receipts/${invoice.id}`}
              className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10"
            >
              PDF
            </a>
          ) : null}

          {canIssue ? (
            <form action={issueInvoice}>
              <input type="hidden" name="id" value={invoice.id} />
              <button
                className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10"
              >
                Issue
              </button>
            </form>
          ) : null}

          {canMarkPaid ? (
            <form action={markInvoicePaid}>
              <input type="hidden" name="id" value={invoice.id} />
              <button
                className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10"
              >
                Mark Paid
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-black/[0.03] dark:bg-white/[0.06]">
            <tr>
              <th className="text-left p-3 font-medium">Description</th>
              <th className="text-right p-3 font-medium w-24">Qty</th>
              <th className="text-right p-3 font-medium w-40">Unit</th>
              <th className="text-right p-3 font-medium w-40">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).length === 0 ? (
              <tr>
                <td className="p-3" colSpan={4}>
                  <div className="text-sm opacity-70">No items yet.</div>
                </td>
              </tr>
            ) : (
              items!.map((it) => {
                const lt = (it.quantity || 0) * (it.unit_price || 0);
                return (
                  <tr key={it.id} className="border-t">
                    <td className="p-3">{it.description}</td>
                    <td className="p-3 text-right tabular-nums">{it.quantity}</td>
                    <td className="p-3 text-right tabular-nums">
                      {money(invoice.currency, it.unit_price)}
                    </td>
                    <td className="p-3 text-right tabular-nums">
                      {money(invoice.currency, lt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr className="border-t">
              <td className="p-3 font-medium text-right" colSpan={3}>
                Total
              </td>
              <td className="p-3 text-right font-semibold">
                {money(invoice.currency, invoice.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
