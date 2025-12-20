// components/SortControls.tsx
import Link from "next/link";

export type SortKey = "created_at" | "due_at" | "number" | "total";
export type SortDir = "asc" | "desc";

export default function SortControls(props: {
  sort: SortKey;
  dir: SortDir;
  status?: string; // keep current filter
  q?: string;      // keep current search
  page?: number;   // keep current page
}) {
  const { sort, dir, status, q, page } = props;

  function hrefFor(next: Partial<{ sort: SortKey; dir: SortDir }>) {
    const qs = new URLSearchParams();
    const s = next.sort ?? sort;
    const d = next.dir ?? dir;

    if (status && status !== "all") qs.set("status", status);
    if (q) qs.set("q", q);
    if (page && page > 1) qs.set("page", String(page));

    qs.set("sort", s);
    qs.set("dir", d);

    return `/invoices?${qs.toString()}`;
  }

  const chip =
    "rounded-xl px-3 py-1.5 text-sm border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10";
  const chipActive =
    chip + " bg-black/10 dark:bg-white/10 font-medium";

  const sorts: { key: SortKey; label: string }[] = [
    { key: "created_at", label: "Created" },
    { key: "due_at", label: "Due" },
    { key: "number", label: "Number" },
    { key: "total", label: "Amount" },
  ];

  return (
    <div className="flex items-center gap-2">
      <div className="text-xs opacity-70">Sort</div>
      <div className="flex items-center gap-1">
        {sorts.map((s) => (
          <Link
            key={s.key}
            href={hrefFor({ sort: s.key })}
            className={s.key === sort ? chipActive : chip}
            aria-current={s.key === sort ? "true" : undefined}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <div className="ml-2 flex items-center gap-1">
        <Link
          href={hrefFor({ dir: "asc" })}
          className={dir === "asc" ? chipActive : chip}
          aria-current={dir === "asc" ? "true" : undefined}
        >
          ↑ Asc
        </Link>
        <Link
          href={hrefFor({ dir: "desc" })}
          className={dir === "desc" ? chipActive : chip}
          aria-current={dir === "desc" ? "true" : undefined}
        >
          ↓ Desc
        </Link>
      </div>
    </div>
  );
}
