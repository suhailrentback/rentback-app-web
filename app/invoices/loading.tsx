// app/invoices/loading.tsx
import Link from "next/link";

export default function LoadingInvoices() {
  return (
    <section className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="h-7 w-40 rounded bg-black/10 dark:bg-white/10" />
        <div className="flex items-center gap-3">
          <div className="h-8 w-32 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/10" />
          <div className="h-8 w-40 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg:white/10" />
          <div className="h-8 w-44 rounded-xl border border-black/10 dark:border:white/10 bg-black/5 dark:bg:white/10" />
        </div>
      </div>

      {/* Mobile skeleton */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-black/10 dark:border-white/10 p-4 space-y-2"
          >
            <div className="h-5 w-28 rounded bg-black/10 dark:bg:white/10" />
            <div className="h-4 w-24 rounded bg-black/10 dark:bg:white/10" />
            <div className="flex items-center justify-between">
              <div className="h-6 w-20 rounded bg-black/10 dark:bg:white/10" />
              <div className="h-6 w-24 rounded bg-black/10 dark:bg:white/10" />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop skeleton table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-white/80 dark:bg-black/40 border-b border-black/10 dark:border-white/10 backdrop-blur sticky top-0 z-10">
            <tr>
              {["Number", "Created", "Due", "Status", "Total", "Actions"].map((h) => (
                <th key={h} className="text-left p-3 font-medium">
                  <div className="h-4 w-24 rounded bg-black/10 dark:bg:white/10" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-t border-black/5 dark:border-white/10">
                <td className="p-3">
                  <div className="h-4 w-24 rounded bg-black/10 dark:bg:white/10" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-28 rounded bg-black/10 dark:bg:white/10" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-20 rounded bg-black/10 dark:bg:white/10" />
                </td>
                <td className="p-3">
                  <div className="h-6 w-20 rounded bg-black/10 dark:bg:white/10" />
                </td>
                <td className="p-3 text-right">
                  <div className="h-4 w-24 rounded bg-black/10 dark:bg:white/10 ml-auto" />
                </td>
                <td className="p-3 text-right">
                  <div className="h-7 w-24 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg:white/10 ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Helpful back link for keyboard users */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 border text-sm
                     hover:bg-black/5 dark:hover:bg:white/10
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                     focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
        >
          ← Home
        </Link>
      </div>
    </section>
  );
}
