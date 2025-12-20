// app/invoices/loading.tsx
import { InvoiceCardSkeleton, InvoiceRowSkeleton, Skeleton } from "@/components/Skeleton";

export default function LoadingInvoices() {
  // Mirrors the invoices index UI to avoid layout shift
  return (
    <section className="p-6 space-y-6" aria-busy="true" aria-live="polite">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">My Invoices</h1>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-40 rounded-xl" aria-label="Loading filters" />
          <Skeleton className="h-9 w-48 rounded-xl" aria-label="Loading search" />
          <Skeleton className="h-9 w-40 rounded-xl" aria-label="Loading sort controls" />
        </div>
      </div>

      {/* Mobile skeleton */}
      <div className="md:hidden">
        <ul className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <InvoiceCardSkeleton key={i} />
          ))}
        </ul>
      </div>

      {/* Desktop table skeleton */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 backdrop-blur bg-white/80 dark:bg-black/40 border-b border-black/10 dark:border-white/10">
            <tr>
              <th className="text-left p-3 font-medium w-36">Number</th>
              <th className="text-left p-3 font-medium w-40">Created</th>
              <th className="text-left p-3 font-medium w-40">Due</th>
              <th className="text-left p-3 font-medium w-32">Status</th>
              <th className="text-right p-3 font-medium w-36">Total</th>
              <th className="text-right p-3 font-medium w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <InvoiceRowSkeleton key={i} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Skeleton className="h-9 w-64 rounded-xl" aria-label="Loading pagination" />
      </div>
    </section>
  );
}
