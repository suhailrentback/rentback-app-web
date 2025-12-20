// app/invoices/[id]/loading.tsx
import { Skeleton } from "@/components/Skeleton";

export default function LoadingInvoiceDetail() {
  return (
    <section className="p-6 space-y-6" aria-busy="true" aria-live="polite">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-44" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-16 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="mt-6">
          <Skeleton className="h-6 w-48" />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[85%]" />
            <Skeleton className="h-4 w-[70%]" />
          </div>
        </div>
      </div>
    </section>
  );
}
