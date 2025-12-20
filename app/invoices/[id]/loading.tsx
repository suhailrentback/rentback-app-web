export default function LoadingInvoiceDetail() {
  return (
    <section className="p-6 space-y-6">
      {/* Header + Actions skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="h-3 w-16 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-7 w-56 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-32 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 animate-pulse" />
          <div className="h-8 w-20 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 animate-pulse" />
        </div>
      </div>

      {/* Summary Card skeleton */}
      <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((k) => (
            <div key={k}>
              <div className="h-3 w-14 rounded bg-black/10 dark:bg-white/10" />
              <div className="mt-2 h-6 w-32 rounded bg-black/10 dark:bg-white/10" />
            </div>
          ))}
        </div>
      </div>

      {/* Details block skeleton */}
      <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6 space-y-3 animate-pulse">
        <div className="h-4 w-48 rounded bg-black/10 dark:bg-white/10" />
        <div className="h-4 w-80 rounded bg-black/10 dark:bg-white/10" />
        <div className="h-4 w-64 rounded bg-black/10 dark:bg-white/10" />
      </div>
    </section>
  );
}
