// components/SortControls.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export type SortKey = "created_at" | "due_at" | "number" | "total";
export type SortDir = "asc" | "desc";
export type StatusFilterKey = "all" | "unpaid" | "overdue" | "paid";

type Props = {
  sort: SortKey;
  dir: SortDir;
  status?: StatusFilterKey;
  q?: string;
  page: number; // provided by caller; we always reset to 1 on change
};

/**
 * Compact sort controls that update the URL (deep-linkable) and preserve filters/search.
 * - Resets page to 1 on any change
 * - Keeps `status` and `q`
 */
export default function SortControls({ sort, dir, status, q }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function push(updates: Partial<{ sort: SortKey; dir: SortDir }>) {
    const params = new URLSearchParams(sp?.toString() ?? "");
    if (status && status !== "all") params.set("status", status);
    else params.delete("status");

    if (q) params.set("q", q);
    else params.delete("q");

    if (updates.sort) params.set("sort", updates.sort);
    if (updates.dir) params.set("dir", updates.dir);

    params.set("page", "1");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort-field" className="sr-only">
        Sort field
      </label>
      <select
        id="sort-field"
        defaultValue={sort}
        onChange={(e) => push({ sort: e.target.value as SortKey })}
        disabled={isPending}
        className="rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
      >
        <option value="created_at">Created</option>
        <option value="due_at">Due</option>
        <option value="number">Number</option>
        <option value="total">Total</option>
      </select>

      <label htmlFor="sort-dir" className="sr-only">
        Sort direction
      </label>
      <select
        id="sort-dir"
        defaultValue={dir}
        onChange={(e) => push({ dir: e.target.value as SortDir })}
        disabled={isPending}
        className="rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
      >
        <option value="desc">Desc</option>
        <option value="asc">Asc</option>
      </select>
    </div>
  );
}
