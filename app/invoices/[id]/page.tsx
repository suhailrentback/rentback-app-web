// app/invoices/[id]/loading.tsx
export default function LoadingInvoiceDetail() {
  return (
    <section className="p-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-20 rounded-xl border border-black/10 dark:border-white/10" />
          <div className="h-7 w-64 rounded bg-black/10 dark:bg-white/10" />
        </div>
        <div className="h-9 w-36 rounded-xl border border-black/10 dark:border-white/10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-black/10 dark:border-white/10 p-4 space-y-2"
          >
            <div className="h-3 w-16 rounded bg-black/10 dark:bg-white/10" />
            <div className="h-5 w-32 rounded bg-black/10 dark:bg-white/10" />
          </div>
        ))}

        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 space-y-2 md:col-span-3">
          <div className="h-3 w-16 rounded bg-black/10 dark:bg-white/10" />
          <div className="h-7 w-40 rounded bg-black/10 dark:bg-white/10" />
        </div>
      </div>
    </section>
  );
}
