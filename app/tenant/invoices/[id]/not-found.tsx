// app/tenant/invoices/[id]/not-found.tsx
import Link from "next/link";

export default function NotFoundInvoice() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold">Invoice not found</h1>
      <p className="mt-2 text-sm text-gray-600">
        We couldn’t find that invoice or you don’t have permission to view it.
      </p>
      <div className="mt-6">
        <Link
          href="/tenant/invoices"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        >
          Back to invoices
        </Link>
      </div>
    </div>
  );
}
