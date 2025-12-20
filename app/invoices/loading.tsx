// app/invoices/loading.tsx
export default function Loading() {
  return (
    <section className="p-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="h-7 w-40 rounded-lg bg-black/10 dark:bg-white/10 animate-pulse" />
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-9 w-40 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-9 w-32 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
        </div>
      </div>

      {/* Mobile skeleton list */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-black/10 dark:border-white/10 p-4 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-black/10 dark:bg-white/10" />
              <div className="h-4 w-20 rounded bg-black/10 dark:bg-white/10" />
            </div>
            <div className="mt-3 h-4 w-32 rounded bg-black/10 dark:bg-white/10" />
            <div className="mt-4 flex items-center justify-end gap-2">
              <div className="h-8 w-16 rounded-xl bg-black/10 dark:bg-white/10" />
              <div className="h-8 w-16 rounded-xl bg-black/10 dark:bg-white/10" />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop skeleton table */}
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
              <tr
                key={i}
                className="border-t border-black/5 dark:border-white/10"
              >
                <td className="p-3">
                  <div className="h-4 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-28 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                </td>
                <td className="p-3">
                  <div className="h-4 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                </td>
                <td className="p-3">
                  <div className="h-6 w-24 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
                </td>
                <td className="p-3">
                  <div className="ml-auto h-4 w-20 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                </td>
                <td className="p-3">
                  <div className="ml-auto flex items-center gap-2">
                    <div className="h-8 w-16 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
                    <div className="h-8 w-16 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer/pagination skeleton */}
      <div className="flex items-center justify-center gap-2">
        <div className="h-10 w-16 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
        <div className="h-10 w-10 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
        <div className="h-10 w-10 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
        <div className="h-10 w-16 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
      </div>
    </section>
  );
}
