// app/invoices/[id]/loading.tsx
export default function LoadingInvoice() {
  return (
    <section className="p-6 space-y-6 animate-pulse">
      <div className="h-4 w-40 rounded bg-black/10 dark:bg-white/10" />
      <div className="h-8 w-64 rounded bg-black/10 dark:bg-white/10" />
      <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-10 rounded bg-black/10 dark:bg-white/10" />
          <div className="h-10 rounded bg-black/10 dark:bg-white/10" />
          <div className="h-10 rounded bg-black/10 dark:bg-white/10" />
        </div>
      </div>
      <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-6 rounded bg-black/10 dark:bg-white/10" />
          <div className="h-6 rounded bg-black/10 dark:bg-white/10" />
          <div className="h-6 rounded bg-black/10 dark:bg-white/10" />
          <div className="h-6 rounded bg-black/10 dark:bg-white/10" />
        </div>
      </div>
    </section>
  );
}
