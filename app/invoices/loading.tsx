import Skeleton from "@/components/Skeleton";

export default function InvoicesLoading() {
  return (
    <section className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-7 w-40" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-40" />
        </div>
      </div>

      {/* Mobile list skeleton */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-black/10 dark:border-white/10 p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>

      {/* Desktop table skeleton */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-white/80 dark:bg-black/40 border-b border-black/10 dark:border-white/10">
            <tr>
              <th className="text-left p-3 font-medium w-36"><Skeleton className="h-5 w-20" /></th>
              <th className="text-left p-3 font-medium w-40"><Skeleton className="h-5 w-24" /></th>
              <th className="text-left p-3 font-medium w-40"><Skeleton className="h-5 w-16" /></th>
              <th className="text-left p-3 font-medium w-32"><Skeleton className="h-5 w-16" /></th>
              <th className="text-right p-3 font-medium w-36"><Skeleton className="h-5 w-16" /></th>
              <th className="text-right p-3 font-medium w-28"><Skeleton className="h-5 w-16" /></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-t border-black/5 dark:border-white/10">
                <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                <td className="p-3"><Skeleton className="h-4 w-28" /></td>
                <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                <td className="p-3"><Skeleton className="h-6 w-20 rounded-full" /></td>
                <td className="p-3 text-right"><Skeleton className="h-4 ml-auto w-24" /></td>
                <td className="p-3 text-right"><Skeleton className="h-8 ml-auto w-24" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
