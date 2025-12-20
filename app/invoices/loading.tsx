// Route-level skeleton for the Invoices list
export default function LoadingInvoices() {
  const rows = Array.from({ length: 6 });

  return (
    <section className="p-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <div className="h-6 w-48 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-4 w-72 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
        </div>
        <div className="h-9 w-28 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-black/5 dark:bg-white/5">
            <tr>
              {["Invoice #", "Issued", "Due", "Status", "Total", "Actions"].map((h) => (
                <th key={h} className="text-left p-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((_, i) => (
              <tr
                key={i}
                className="border-t border-black/5 dark:border-white/10 animate-pulse"
              >
                <td className="p-3">
                  <div className="h-4 w-32 rounded bg-black/10 dark:bg-white/10" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-24 rounded bg-black/10 dark:bg-white/10" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-24 rounded bg-black/10 dark:bg-white/10" />
                </td>
                <td className="p-3">
                  <div className="h-5 w-20 rounded-full bg-black/10 dark:bg-white/10" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-28 rounded bg-black/10 dark:bg-white/10" />
                </td>
                <td className="p-3">
                  <div className="h-8 w-24 rounded-xl bg-black/10 dark:bg-white/10" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer hint skeleton */}
      <div className="h-4 w-40 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
    </section>
  );
}
