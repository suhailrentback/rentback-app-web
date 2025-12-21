import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="p-6">
      <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6 space-y-3">
        <div className="space-y-1">
          <div className="text-xs opacity-70">Invoice</div>
          <h1 className="text-2xl font-semibold">Invoice not found</h1>
          <p className="text-sm opacity-80">
            The invoice you’re looking for doesn’t exist or you don’t have access.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/invoices"
            className="inline-block rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
          >
            Back to invoices
          </Link>
        </div>
      </div>
    </section>
  );
}
