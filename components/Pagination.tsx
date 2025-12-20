// components/Pagination.tsx
import Link from "next/link";

export default function Pagination(props: {
  page: number;
  totalPages: number;
  status?: string; // keep current filter
  q?: string;      // keep current search
}) {
  const { page, totalPages, status, q } = props;

  function hrefFor(p: number) {
    const qs = new URLSearchParams();
    if (p > 1) qs.set("page", String(p));
    if (status && status !== "all") qs.set("status", status);
    if (q) qs.set("q", q);
    const query = qs.toString();
    return `/invoices${query ? `?${query}` : ""}`;
    }

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const btn =
    "rounded-xl px-3 py-1.5 text-sm border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none";

  return (
    <nav className="flex items-center justify-between gap-3" aria-label="Pagination">
      <div className="text-xs opacity-70">
        Page <span className="tabular-nums">{page}</span> of{" "}
        <span className="tabular-nums">{totalPages}</span>
      </div>
      <div className="flex items-center gap-2">
        {hasPrev ? (
          <Link className={btn} href={hrefFor(page - 1)}>
            Previous
          </Link>
        ) : (
          <button className={btn} disabled>
            Previous
          </button>
        )}
        {hasNext ? (
          <Link className={btn} href={hrefFor(page + 1)}>
            Next
          </Link>
        ) : (
          <button className={btn} disabled>
            Next
          </button>
        )}
      </div>
    </nav>
  );
}
