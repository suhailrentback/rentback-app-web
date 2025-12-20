// components/Pagination.tsx
"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { StatusFilterKey } from "@/components/StatusFilters";

type Props = {
  page: number;
  totalPages: number;
  status?: StatusFilterKey;
  q?: string;
};

function pageRange(curr: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "...")[] = [];
  const add = (n: number | "...") => out.push(n);

  const windowLeft = Math.max(2, curr - 1);
  const windowRight = Math.min(total - 1, curr + 1);

  add(1);
  if (windowLeft > 2) add("...");
  for (let n = windowLeft; n <= windowRight; n++) add(n);
  if (windowRight < total - 1) add("...");
  add(total);

  return Array.from(new Set(out)).filter(Boolean) as (number | "...");
}

export default function Pagination({ page, totalPages, status, q }: Props) {
  const pathname = usePathname();
  const sp = useSearchParams();

  const baseParams = useMemo(() => {
    const params = new URLSearchParams(sp?.toString() ?? "");
    // Preserve sort & dir already in URL; allow props to override status/q if provided.
    if (status !== undefined) {
      if (status) params.set("status", status);
      else params.delete("status");
    }
    if (q !== undefined) {
      if (q) params.set("q", q);
      else params.delete("q");
    }
    return params;
  }, [sp, status, q]);

  const items = pageRange(page, totalPages);

  const makeHref = (p: number) => {
    const params = new URLSearchParams(baseParams.toString());
    params.set("page", String(p));
    return `${pathname}?${params.toString()}`;
  };

  const prevHref = makeHref(Math.max(1, page - 1));
  const nextHref = makeHref(Math.min(totalPages, page + 1));

  return (
    <nav
      className="flex items-center justify-end gap-2"
      aria-label="Invoices pagination"
    >
      <Link
        href={prevHref}
        aria-label="Previous page"
        aria-disabled={page <= 1}
        className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                   focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black
                   disabled:opacity-50"
      >
        Prev
      </Link>

      <ul className="flex items-center gap-1" role="list">
        {items.map((it, i) =>
          it === "..." ? (
            <li key={`ellipsis-${i}`} aria-hidden className="px-2 text-xs opacity-70">
              …
            </li>
          ) : (
            <li key={it}>
              <Link
                href={makeHref(it)}
                aria-current={it === page ? "page" : undefined}
                className={`rounded-xl px-3 py-1.5 border text-xs focus-visible:outline-none
                            focus-visible:ring-2 focus-visible:ring-emerald-500
                            focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black
                            hover:bg-black/5 dark:hover:bg-white/10
                            ${it === page ? "bg-black/5 dark:bg-white/10 font-medium" : ""}`}
              >
                {it}
              </Link>
            </li>
          )
        )}
      </ul>

      <Link
        href={nextHref}
        aria-label="Next page"
        aria-disabled={page >= totalPages}
        className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                   focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black
                   disabled:opacity-50"
      >
        Next
      </Link>
    </nav>
  );
}
