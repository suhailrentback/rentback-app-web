// app/invoices/[id]/not-found.tsx
import Link from "next/link";

export default function InvoiceNotFound() {
  return (
    <section className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Invoice not found</h1>
      <p className="text-sm opacity-80">
        The invoice you’re looking for doesn’t exist or you don’t have access to it.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/invoices"
          className="rounded-xl px-3 py-1.5 border text-sm hover:bg-black/5 dark:hover:bg-white/10
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                     focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
        >
          ← Back to Invoices
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
    </section>
  );
}
