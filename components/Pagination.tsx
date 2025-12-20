// components/Pagination.tsx
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import clsx from "clsx";

export type StatusFilterKey = "all" | "unpaid" | "overdue" | "paid";
export type SortKey = "created_at" | "due_at" | "number" | "total";
export type SortDir = "asc" | "desc";

type Props = {
  page: number;
  totalPages: number;
  status?: StatusFilterKey;
  q?: string;
  sort?: SortKey;
  dir?: SortDir;
};

export default function Pagination({
  page,
  totalPages,
  status,
  q,
  sort,
  dir,
}: Props) {
  const pathname = usePathname();
  const sp = useSearchParams();

  const currentSort = (sort ?? (sp?.get("sort") as SortKey)) || "created_at";
  const currentDir = (dir ?? (sp?.get("dir") as SortDir)) || "desc";
  const currentStatus =
    status ?? ((sp?.get("status") as StatusFilterKey) || undefined);
  const currentQ = q ?? sp?.get("q") ?? undefined;

  function hrefFor(p: number) {
    const params = new URLSearchParams(sp?.toString() ?? "");
    params.set("page", String(p));
    params.set("sort", currentSort);
    params.set("dir", currentDir);

    if (currentStatus && currentStatus !== "all")
      params.set("status", currentStatus);
    else params.delete("status");

    if (currentQ) params.set("q", currentQ);
    else params.delete("q");

    return `${pathname}?${params.toString()}`;
  }

  const canPrev = page > 1;
  const canNext = page < totalPages;

  function range(start: number, end: number) {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  let pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    pages = range(1, totalPages);
  } else {
    const win = 1; // neighbors around current
    const start = Math.max(2, page - win);
    const end = Math.min(totalPages - 1, page + win);
    pages = [1];
    if (start > 2) pages.push("…");
    pages.push(...range(start, end));
    if (end < totalPages - 1) pages.push("…");
    pages.push(totalPages);
  }

  if (totalPages <= 1) return null;

  const btnBase =
    "inline-flex items-center justify-center rounded-xl border border-black/10 dark:border-white/10 px-3 min-w-10 h-10 text-xs font-medium " +
    "hover:bg-black/5 dark:hover:bg-white/10 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 " +
    "focus-visible:ring-offset-white dark:focus-visible:ring-offset-black";

  function PageButton({
    href,
    disabled,
    children,
    rel,
    current,
  }: {
    href: string;
    disabled?: boolean;
    children: React.ReactNode;
    rel?: string;
    current?: boolean;
  }) {
    const classes = clsx(
      btnBase,
      disabled && "opacity-50 pointer-events-none cursor-not-allowed",
      current &&
        "ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-black bg-black/5 dark:bg-white/10"
    );

    if (disabled) {
      return (
        <span aria-disabled="true" className={classes}>
          {children}
        </span>
      );
    }
    return (
      <Link
        href={href}
        prefetch={false}
        scroll={false}
        rel={rel}
        aria-current={current ? "page" : undefined}
        className={classes}
      >
        {children}
      </Link>
    );
  }

  return (
    <nav aria-label="Pagination" className="mt-6">
      {/* Mobile: prev/next only with 44px+ tap targets */}
      <div className="flex md:hidden items-center justify-between gap-2">
        <PageButton href={hrefFor(Math.max(1, page - 1))} disabled={!canPrev}>
          Previous
        </PageButton>
        <div className="text-xs opacity-70">Page {page} of {totalPages}</div>
        <PageButton
          href={hrefFor(Math.min(totalPages, page + 1))}
          disabled={!canNext}
        >
          Next
        </PageButton>
      </div>

      {/* Desktop: numbered with ellipses */}
      <div className="hidden md:flex items-center justify-center gap-2">
        <PageButton href={hrefFor(1)} disabled={!canPrev} rel="first">
          First
        </PageButton>
        <PageButton
          href={hrefFor(Math.max(1, page - 1))}
          disabled={!canPrev}
          rel="prev"
        >
          Prev
        </PageButton>

        <ul className="flex items-center gap-1">
          {pages.map((p, i) =>
            p === "…" ? (
              <li key={`dots-${i}`} aria-hidden className="px-2">
                …
              </li>
            ) : (
              <li key={p}>
                <PageButton href={hrefFor(p)} current={p === page}>
                  {p}
                </PageButton>
              </li>
            )
          )}
        </ul>

        <PageButton
          href={hrefFor(Math.min(totalPages, page + 1))}
          disabled={!canNext}
          rel="next"
        >
          Next
        </PageButton>
        <PageButton href={hrefFor(totalPages)} disabled={!canNext} rel="last">
          Last
        </PageButton>
      </div>
    </nav>
  );
}
