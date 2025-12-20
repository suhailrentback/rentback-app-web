// app/invoices/loading.tsx
export default function LoadingInvoices() {
  return (
    <section className="p-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="h-7 w-40 rounded bg-black/10 dark:bg-white/10" />
        <div className="flex items-center gap-3">
          <div className="h-8 w-28 rounded-xl border border-black/10 dark:border-white/10" />
          <div className="h-8 w-36 rounded-xl border border-black/10 dark:border-white/10" />
          <div className="h-8 w-40 rounded-xl border border-black/10 dark:border-white/10" />
        </div>
      </div>

      {/* Mobile skeleton list */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-black/10 dark:border-white/10 p-4 space-y-3"
          >
            <div className="h-4 w-32 rounded bg-black/10 dark:bg-white/10" />
            <div className="h-4 w-24 rounded bg-black/10 dark:bg-white/10" />
            <div className="h-6 w-20 rounded bg-black/10 dark:bg-white/10" />
          </div>
        ))}
      </div>

      {/* Desktop skeleton table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-white/80 dark:bg-black/40 border-b border-black/10 dark:border-white/10">
            <tr>
              {["Number", "Created", "Due", "Status", "Total", "Actions"].map((h) => (
                <th key={h} className="text-left p-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-t border-black/5 dark:border-white/10">
                <td className="p-3">
                  <div className="h-4 w-24 rounded bg-black/10 dark:bg-white/10" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-28 rounded bg-black/10 dark:bg-white/10" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-24 rounded bg-black/10 dark:bg-white/10" />
                </td>
                <td className="p-3">
                  <div className="h-6 w-20 rounded bg-black/10 dark:bg-white/10" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-16 ml-auto rounded bg-black/10 dark:bg-white/10" />
                </td>
                <td className="p-3">
                  <div className="ml-auto h-8 w-24 rounded-xl border border-black/10 dark:border-white/10" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
