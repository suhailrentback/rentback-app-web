// components/Pagination.tsx
import Link from "next/link";
import clsx from "clsx";
import type { StatusFilterKey } from "@/components/StatusFilters";

type Props = {
  page: number;
  totalPages: number;
  status?: StatusFilterKey;
  q?: string;
};

type PageItem = number | "...";

function buildPages(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 1) return [1];

  const delta = 1; // neighbors each side of the current page
  const range: number[] = [];
  const result: PageItem[] = [];

  const left = Math.max(1, page - delta);
  const right = Math.min(totalPages, page + delta);

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= left && i <= right)) {
      range.push(i);
    }
  }

  let prev = 0;
  for (const i of range) {
    if (prev) {
      if (i - prev === 2) result.push(prev + 1);
      else if (i - prev > 2) result.push("...");
    }
    result.push(i);
    prev = i;
  }

  return result;
}

function hrefFor(p: number, status?: StatusFilterKey, q?: string) {
  const params = new URLSearchParams();
  params.set("page", String(p));
  if (status && status !== "all") params.set("status", status);
  if (q && q.trim()) params.set("q", q.trim());
  return `/invoices?${params.toString()}`;
}

export default function Pagination({ page, totalPages, status, q }: Props) {
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(totalPages) || totalPages < 1) totalPages = 1;
  const items = buildPages(page, totalPages);

  if (totalPages <= 1) return null;

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <nav className="flex items-center justify-between mt-4" aria-label="Pagination">
      {/* Prev */}
      <div>
        {prevDisabled ? (
          <span className="rounded-xl px-3 py-1.5 border text-xs opacity-50 cursor-not-allowed select-none">
            Prev
          </span>
        ) : (
          <Link
            href={hrefFor(page - 1, status, q)}
            className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                       focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
          >
            Prev
          </Link>
        )}
      </div>

      {/* Pages */}
      <ul className="flex items-center gap-1" role="list">
        {items.map((it, idx) =>
          it === "..." ? (
            <li key={`ellipsis-${idx}`} className="px-2 text-xs opacity-60 select-none">
              …
            </li>
          ) : (
            <li key={it}>
              {it === page ? (
                <span
                  aria-current="page"
                  className={clsx(
                    "rounded-xl px-3 py-1.5 text-xs border",
                    "bg-black/5 dark:bg-white/10 font-medium"
                  )}
                >
                  {it}
                </span>
              ) : (
                <Link
                  href={hrefFor(it, status, q)}
                  className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                             focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
                >
                  {it}
                </Link>
              )}
            </li>
          )
        )}
      </ul>

      {/* Next */}
      <div>
        {nextDisabled ? (
          <span className="rounded-xl px-3 py-1.5 border text-xs opacity-50 cursor-not-allowed select-none">
            Next
          </span>
        ) : (
          <Link
            href={hrefFor(page + 1, status, q)}
            className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg:white/10
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                       focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
          >
            Next
          </Link>
        )}
      </div>
    </nav>
  );
}
