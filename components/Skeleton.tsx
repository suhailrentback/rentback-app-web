// components/Skeleton.tsx
export function Skeleton({
  className = "",
  "aria-label": ariaLabel,
}: {
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div
      aria-label={ariaLabel}
      aria-busy="true"
      className={`animate-pulse rounded-md bg-black/10 dark:bg-white/10 ${className}`}
    />
  );
}

export function InvoiceRowSkeleton() {
  return (
    <tr className="border-t border-black/5 dark:border-white/10">
      <td className="p-3"><Skeleton className="h-5 w-24" /></td>
      <td className="p-3"><Skeleton className="h-5 w-28" /></td>
      <td className="p-3"><Skeleton className="h-5 w-24" /></td>
      <td className="p-3"><Skeleton className="h-6 w-24 rounded-full" /></td>
      <td className="p-3 text-right"><Skeleton className="inline-block h-5 w-20" /></td>
      <td className="p-3 text-right">
        <div className="flex justify-end gap-2">
          <Skeleton className="h-7 w-14 rounded-xl" />
          <Skeleton className="h-7 w-14 rounded-xl" />
        </div>
      </td>
    </tr>
  );
}

export function InvoiceCardSkeleton() {
  return (
    <li className="relative rounded-2xl border border-black/10 dark:border-white/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Skeleton className="h-5 w-16" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-14 rounded-xl" />
          <Skeleton className="h-7 w-14 rounded-xl" />
        </div>
      </div>
    </li>
  );
}
