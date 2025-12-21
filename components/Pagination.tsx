import Link from "next/link";
import clsx from "clsx";
import { type StatusFilterKey } from "@/components/StatusFilters";

type Props = {
  page: number;
  totalPages: number;
  status?: StatusFilterKey;
  q?: string;
};

type PageToken = number | "...";

function buildPageList(total: number, current: number): PageToken[] {
  // Always show first/last, neighbors around current, with smart ellipses
  const out: PageToken[] = [];
  const add = (n: PageToken) => out.push(n);

  if (total <= 7) {
    for (let i = 1; i <= total; i++) add(i);
    return out;
  }

  add(1);

  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);

  if (left > 2) add("...");
  for (let i = left; i <= right; i++) add(i);
  if (right < total - 1) add("...");

  add(total);
  return out;
}

function hrefFor(p: number, status?: StatusFilterKey, q?: string) {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (q && q.trim()) params.set("q", q.trim());
  params.set("page", String(p));
  const qs = params.toString();
  return qs ? `/invoices?${qs}` : "/invoices";
}

export default function Pagination({ page, totalPages, status, q }: Props) {
  if (totalPages <= 1) return null;

  const items = buildPageList(totalPages, page);

  return (
    <nav
      className="mt-6"
      aria-label="Pagination"
    >
      <ul className="flex items-center gap-1" role="list">
        {/* Previous */}
        <li role="listitem">
          {page > 1 ? (
            <Link
              href={hrefFor(page - 1, status, q)}
              aria-label="Previous page"
              className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
            >
              Prev
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="rounded-xl px-3 py-1.5 border text-xs opacity-40 cursor-not-allowed"
            >
              Prev
            </span>
          )}
        </li>

        {/* Page numbers */}
        {items.map((tok, i) => {
          if (tok === "...") {
            return (
              <li key={`gap-${i}`} role="listitem" aria-hidden="true">
                <span className="px-2 text-xs opacity-60">…</span>
              </li>
            );
          }
          const isCurrent = tok === page;
          return (
            <li key={tok} role="listitem">
              {isCurrent ? (
                <span
                  aria-current="page"
                  className={clsx(
                    "rounded-xl px-3 py-1.5 text-xs",
                    "bg-emerald-600 text-white dark:bg-emerald-500"
                  )}
                >
                  {tok}
                </span>
              ) : (
                <Link
                  href={hrefFor(tok, status, q)}
                  aria-label={`Go to page ${tok}`}
                  className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
                >
                  {tok}
                </Link>
              )}
            </li>
          );
        })}

        {/* Next */}
        <li role="listitem">
          {page < totalPages ? (
            <Link
              href={hrefFor(page + 1, status, q)}
              aria-label="Next page"
              className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
            >
              Next
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="rounded-xl px-3 py-1.5 border text-xs opacity-40 cursor-not-allowed"
            >
              Next
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
