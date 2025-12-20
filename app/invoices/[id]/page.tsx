// app/invoices/[id]/loading.tsx
export default function Loading() {
  return (
    <section className="px-6 py-8 max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-6 w-48 rounded bg-black/10 dark:bg-white/10" />
          <div className="h-4 w-56 rounded bg-black/10 dark:bg-white/10" />
        </div>
        <div className="h-6 w-24 rounded-full bg-black/10 dark:bg-white/10" />
      </div>
      <div className="rounded-2xl border border-black/10 dark:border-white/10 p-5 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 w-24 rounded bg-black/10 dark:bg-white/10" />
            <div className="h-4 w-40 rounded bg-black/10 dark:bg-white/10" />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <div className="h-9 w-36 rounded bg-black/10 dark:bg-white/10" />
        <div className="h-9 w-32 rounded bg-black/10 dark:bg-white/10" />
        <div className="ml-auto h-9 w-40 rounded bg-black/10 dark:bg-white/10" />
      </div>
    </section>
  );
}
