// components/SortHeader.tsx
import Link from "next/link";

export type SortKey = "created_at" | "due_at" | "number" | "total";
export type SortDir = "asc" | "desc";
export type StatusFilterKey = "all" | "unpaid" | "overdue" | "paid";

type Props = {
  label: string;
  field: SortKey;
  activeSort: SortKey;
  dir: SortDir;
  status?: StatusFilterKey;
  q?: string;
  page: number; // not used directly, but kept for API parity with caller
};

/**
 * Renders a clickable column header that toggles sort and updates the URL query.
 * - If you click an inactive column => activates it with "desc" by default.
 * - If you click the active column => toggles dir asc/desc.
 * - Preserves `status` and `q`, resets page=1.
 */
export default function SortHeader({
  label,
  field,
  activeSort,
  dir,
  status,
  q,
}: Props) {
  const isActive = field === activeSort;
  const nextDir: SortDir = isActive ? (dir === "asc" ? "desc" : "asc") : "desc";

  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (q) params.set("q", q);
  params.set("sort", field);
  params.set("dir", nextDir);
  params.set("page", "1");

  const href = `/invoices?${params.toString()}`;

  const ariaLabel = isActive
    ? `Sort by ${label} (${dir === "asc" ? "descending" : "ascending"})`
    : `Sort by ${label} (descending)`;

  // Simple indicator (no new icons, minimal UI change)
  const indicator = isActive ? (dir === "asc" ? "↑" : "↓") : "↕";

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-black/5 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
    >
      <span className="font-medium">{label}</span>
      <span aria-hidden="true" className="text-xs opacity-70">
        {indicator}
      </span>
    </Link>
  );
}
