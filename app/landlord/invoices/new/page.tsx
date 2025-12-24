import { createInvoice } from '@/app/actions/invoices';
import Link from 'next/link';

export default function NewInvoicePage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const error = (searchParams?.error as string) || '';
  return (
    <section className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Create Invoice</h1>
        <Link
          href="/invoices"
          className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10"
        >
          Back to Invoices
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-300/60 dark:border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      <form action={createInvoice} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-xs opacity-70">Due date</span>
            <input
              type="date"
              name="due_at"
              className="mt-1 w-full rounded-xl border px-3 py-2 bg-transparent"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs opacity-70">Currency</span>
            <input
              type="text"
              name="currency"
              defaultValue="USD"
              className="mt-1 w-full rounded-xl border px-3 py-2 bg-transparent uppercase"
            />
          </label>
        </div>

        <div className="space-y-3">
          <div className="font-medium">Line items</div>

          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="grid grid-cols-1 md:grid-cols-6 gap-3 rounded-2xl border p-3"
            >
              <label className="md:col-span-3">
                <span className="text-xs opacity-70">Description</span>
                <input
                  type="text"
                  name={`item${i}_desc`}
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
                  className="mt-1 w-full rounded-xl border px-3 py-2 bg-transparent"
                />
              </label>
            </div>
          ))}
          <div className="text-xs opacity-70">
            Totals auto-calc (qty × unit price). Add up to 3 items.
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-2xl px-4 py-2 border font-medium hover:bg-black/5 dark:hover:bg-white/10"
          >
            Save Draft
          </button>
        </div>
      </form>
    </section>
  );
}
