// Route-level skeleton for the Invoice detail page
export default function LoadingInvoiceDetail() {
  const rows = Array.from({ length: 4 });

  return (
    <section className="p-6 space-y-6">
      {/* Title + actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="h-7 w-80 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-4 w-56 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
        </div>
        <div className="h-9 w-36 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
      </div>

      {/* Two meta cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 space-y-2">
          <div className="h-5 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-4 w-56 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-4 w-40 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-4 w-48 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 space-y-2">
          <div className="h-5 w-28 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-4 w-48 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-4 w-40 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-4 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
        </div>
      </div>

      {/* Line items table */}
      <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-black/5 dark:bg-white/5">
            <tr>
              {["Description", "Qty", "Unit", "Amount"].map((h) => (
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
                  <div className="h-4 w-64 rounded bg-black/10 dark:bg-white/10" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-10 rounded bg-black/10 dark:bg-white/10" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-20 rounded bg-black/10 dark:bg-white/10" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-24 rounded bg-black/10 dark:bg-white/10" />
                </td>
              </tr>
            ))}

            {/* Totals rows */}
            {["Subtotal", "Tax", "Total"].map((label) => (
              <tr
                key={label}
                className="border-t border-black/5 dark:border-white/10 animate-pulse"
              >
                <td className="p-3 font-medium" colSpan={3}>
                  {label}
                </td>
                <td className="p-3">
                  <div className="ml-auto h-4 w-24 rounded bg-black/10 dark:bg-white/10" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes card */}
      <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4">
        <div className="h-5 w-20 rounded bg-black/10 dark:bg-white/10 animate-pulse mb-2" />
        <div className="space-y-2">
          <div className="h-4 w-4/5 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-4 w-2/3 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
