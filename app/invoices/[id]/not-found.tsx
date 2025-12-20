// app/invoices/[id]/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <section className="px-6 py-16 max-w-xl mx-auto text-center space-y-4">
      <h1 className="text-2xl font-semibold">Invoice not found</h1>
      <p className="text-sm opacity-70">
        We couldn’t find that invoice, or you don’t have permission to view it.
      </p>
      <div className="pt-2">
        <Link
          href="/invoices"
          className="inline-block rounded-xl px-4 py-2 text-sm border hover:bg-black/5 dark:hover:bg-white/10"
        >
          Back to invoices
        </Link>
      </div>
    </section>
  );
}
