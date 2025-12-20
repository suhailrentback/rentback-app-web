export default function LoadingInvoices() {
  const rows = Array.from({ length: 8 });

  return (
    <section className="p-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="h-3 w-16 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-7 w-48 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="h-8 w-28 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 animate-pulse" />
          <div className="h-8 w-40 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 animate-pulse" />
          <div className="h-8 w-32 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 animate-pulse" />
        </div>
      </div>

      {/* Mobile list skeleton */}
      <div className="md:hidden space-y-3">
        {rows.map((_, i) => (
          <div
            key={`m-${i}`}
            className="rounded-2xl border border-black/10 dark:border-white/10 p-4 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-24 rounded bg-black/10 dark:bg-white/10" />
                <div className="h-3 w-36 rounded bg-black/10 dark:bg-white/10" />
              </div>
              <div className="h-6 w-20 rounded bg-black/10 dark:bg-white/10" />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table skeleton */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-black/5 dark:bg-white/5">
            <tr>
              <th className="p-3">
                <div className="h-4 w-20 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
              </th>
              <th className="p-3">
                <div className="h-4 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
              </th>
              <th className="p-3">
                <div className="h-4 w-16 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
              </th>
              <th className="p-3">
                <div className="h-4 w-16 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
              </th>
              <th className="p-3 text-right">
                <div className="ml-auto h-4 w-16 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
              </th>
              <th className="p-3 text-right">
                <div className="ml-auto h-4 w-16 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((_, i) => (
              <tr key={i} className="border-t border-black/5 dark:border-white/10">
                <td className="p-3">
                  <div className="h-4 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-28 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-20 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                </td>
                <td className="p-3">
                  <div className="h-6 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                </td>
                <td className="p-3">
                  <div className="ml-auto h-4 w-20 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                </td>
                <td className="p-3">
                  <div className="ml-auto h-7 w-24 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 animate-pulse" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
