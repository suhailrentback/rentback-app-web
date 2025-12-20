// app/invoices/error.tsx
"use client";

import Link from "next/link";

export default function InvoicesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="p-6">
      <div className="rounded-2xl border border-rose-300/60 dark:border-rose-700/50 bg-rose-50 dark:bg-rose-900/20 p-6">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-sm opacity-80 mt-1">
          {error.message || "We couldn’t load your invoices."}
        </p>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={reset}
            className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                       focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
            aria-label="Try loading invoices again"
          >
            Try again
          </button>
          <Link
            href="/invoices"
            className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                       focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
            aria-label="Reset filters and search"
          >
            Reset filters
          </Link>
          <Link
            href="/"
            className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                       focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
          >
            Home
          </Link>
        </div>

        {process.env.NODE_ENV !== "production" && error.digest ? (
          <p className="text-[11px] opacity-60 mt-3">Digest: {error.digest}</p>
        ) : null}
      </div>
    </section>
  );
}
