// app/landlord/invoices/new/page.tsx
import { createInvoice } from './actions';

function plusDays(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const dynamic = 'force-dynamic';

export default function NewInvoicePage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const err = searchParams?.err ? String(searchParams.err) : null;
  const defaultDue = plusDays(7);

  return (
    <section className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Create Invoice</h1>
      </div>

      {err ? (
        <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-200">
          {err}
        </div>
      ) : null}

      <form action={createInvoice} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="block">
            <div className="text-xs opacity-70 mb-1">Currency</div>
            <select
              name="currency"
              defaultValue="USD"
              className="w-full rounded-xl border border-black/10 dark:border-white/10 px-3 py-2 bg-transparent"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="PKR">PKR</option>
              <option value="GBP">GBP</option>
            </select>
          </label>

          <label className="block">
            <div className="text-xs opacity-70 mb-1">Due date</div>
            <input
              type="date"
              name="due_at"
              defaultValue={defaultDue}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 px-3 py-2 bg-transparent"
              required
            />
          </label>

          <label className="block">
            <div className="text-xs opacity-70 mb-1">Tax rate (%)</div>
            <input
              type="number"
              name="tax_rate"
              defaultValue={0}
              step="0.01"
              min="0"
              className="w-full rounded-xl border border-black/10 dark:border-white/10 px-3 py-2 bg-transparent"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/10">
              <tr>
                <th className="text-left p-3 font-medium w-[50%]">Description</th>
                <th className="text-left p-3 font-medium w-[15%]">Qty</th>
                <th className="text-left p-3 font-medium w-[20%]">Unit price</th>
                <th className="text-left p-3 font-medium w-[15%]"> </th>
              </tr>
            </thead>
            <tbody>
              {[
                { desc: 'Rent', qty: 1, price: '' },
                { desc: '', qty: '', price: '' },
                { desc: '', qty: '', price: '' },
                { desc: '', qty: '', price: '' },
                { desc: '', qty: '', price: '' },
              ].map((row, i) => (
                <tr key={i} className="border-t border-black/5 dark:border-white/10">
                  <td className="p-3">
                    <input
                      name="desc[]"
                      defaultValue={row.desc as string}
                      placeholder="e.g. Rent – December"
                      className="w-full rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 bg-transparent"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      name="qty[]"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={row.qty as number | string}
                      className="w-full rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 bg-transparent"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      name="price[]"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={row.price as number | string}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 bg-transparent"
                    />
                  </td>
                  <td className="p-3 text-xs opacity-60">Leave blank rows empty</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-3">
          <button
            name="intent"
            value="draft"
            className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                       focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
          >
            Save Draft
          </button>
          <button
            name="intent"
            value="issue"
            className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                       focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
            title="Requires at least one line item and a positive total"
          >
            Save &amp; Issue
          </button>
        </div>
      </form>
    </section>
  );
}
