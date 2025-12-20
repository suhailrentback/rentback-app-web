// app/invoices/error.tsx
"use client";

export default function InvoicesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-sm opacity-80">
        We couldn’t load your invoices just now. You can try again.
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={reset}
          className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg:white/10
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                     focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
        >
          Try again
        </button>
        <a
          href="/invoices"
          className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg:white/10
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                     focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
        >
          Refresh page
        </a>
      </div>

      {/* Optional tech detail for debugging in dev logs */}
      {process.env.NODE_ENV !== "production" && error?.digest ? (
        <code className="block text-xs opacity-70 break-all mt-2">
          {error.digest}
        </code>
      ) : null}
    </section>
  );
}
