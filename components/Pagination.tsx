import Link from "next/link";

type PageEl = number | "...";

function makeWindow(page: number, total: number): PageEl[] {
  const out: PageEl[] = [];

  const add = (n: number) => {
    if (n >= 1 && n <= total) out.push(n);
  };

  // Always include first, last, current, +/- 1
  add(1);
  add(page - 1);
  add(page);
  add(page + 1);
  add(total);

  // Sort and dedupe
  const uniq = Array.from(new Set(out)).sort((a, b) => (a as number) - (b as number));

  // Insert ellipses where gaps exist
  const withDots: PageEl[] = [];
  for (let i = 0; i < uniq.length; i++) {
    const cur = uniq[i] as number;
    const prev = i > 0 ? (uniq[i - 1] as number) : null;
    if (prev != null && cur - prev > 1) {
      withDots.push("...");
    }
    withDots.push(cur);
  }
  return withDots;
}

function hrefWith(
  basePath: string,
  params: Record<string, string | undefined>,
  page: number
) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") usp.set(k, v);
  }
  usp.set("page", String(page));
  return `${basePath}?${usp.toString()}`;
}

type Props = {
  page: number;
  totalPages: number;
  /** Legacy props (kept for compatibility) */
  status?: "all" | "unpaid" | "overdue" | "paid";
  q?: string;
  /** New: any extra query params to preserve */
  extra?: Record<string, string | undefined>;
  basePath?: string;
};

export default function Pagination({
  page,
  totalPages,
  status,
  q,
  extra,
  basePath = "/invoices",
}: Props) {
  if (totalPages <= 1) return null;

  const windowed = makeWindow(page, totalPages);
  const params: Record<string, string | undefined> = {
    ...(status && status !== "all" ? { status } : {}),
    ...(q ? { q } : {}),
    ...(extra ?? {}),
  };

  return (
    <nav className="flex items-center justify-between gap-3 mt-4">
      <div className="text-xs opacity-70">
        Page {page} of {totalPages}
      </div>
      <div className="flex items-center gap-1">
        <Link
          aria-label="Previous page"
          href={hrefWith(basePath, params, Math.max(1, page - 1))}
          className="rounded-lg px-2 py-1 border text-xs hover:bg-black/5 dark:hover:bg-white/10"
        >
          ‹
        </Link>
        {windowed.map((el, idx) =>
          el === "..." ? (
            <span key={`dots-${idx}`} className="px-2 text-xs opacity-60">
              …
            </span>
          ) : (
            <Link
              key={el}
              href={hrefWith(basePath, params, el)}
              aria-current={el === page ? "page" : undefined}
              className={[
                "rounded-lg px-2 py-1 border text-xs",
                el === page ? "bg-black/5 dark:bg-white/10" : "hover:bg-black/5 dark:hover:bg-white/10",
              ].join(" ")}
            >
              {el}
            </Link>
          )
        )}
        <Link
          aria-label="Next page"
          href={hrefWith(basePath, params, Math.min(totalPages, page + 1))}
          className="rounded-lg px-2 py-1 border text-xs hover:bg-black/5 dark:hover:bg-white/10"
        >
          ›
        </Link>
      </div>
    </nav>
  );
}
