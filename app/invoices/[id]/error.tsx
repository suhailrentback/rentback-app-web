'use client';

import Link from 'next/link';

export default function Error(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { error, reset } = props;

  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.error('Invoice detail route error:', error);
  }

  return (
    <section className="p-6">
      <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6 space-y-3">
        <div className="space-y-1">
          <div className="text-xs opacity-70">Invoice</div>
          <h1 className="text-2xl font-semibold">We couldn’t load this invoice</h1>
          <p className="text-sm opacity-80">
            The invoice might have been deleted, or there was a temporary problem.
          </p>
          {error?.digest ? (
            <div className="text-xs opacity-50">Error ID: {error.digest}</div>
          ) : null}
        </div>

        <div className="pt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
          >
            Try again
          </button>
          <Link
            href="/invoices"
            className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
          >
            Back to invoices
          </Link>
          <a
            href="mailto:help@rentback.app?subject=Invoice%20page%20error"
            className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
          >
            Contact support
          </a>
        </div>
      </div>
    </section>
  );
}
