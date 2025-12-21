'use client';

import Link from 'next/link';

export default function Error(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { error, reset } = props;

  // Safe log for debugging; not shown to users
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.error('Invoices route error:', error);
  }

  return (
    <section className="p-6">
      <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6 space-y-3">
        <div className="space-y-1">
          <div className="text-xs opacity-70">Invoices</div>
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-sm opacity-80">
            We couldn’t load your invoices. This can happen if the network is
            flaky or your session expired.
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
            Reset filters
          </Link>
          <Link
            href="/"
            className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
          >
            Go home
          </Link>
          <a
            href="mailto:help@rentback.app?subject=Invoices%20error"
            className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
          >
            Contact support
          </a>
        </div>
      </div>
    </section>
  );
}
