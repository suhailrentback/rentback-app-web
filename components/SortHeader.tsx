// components/SortHeader.tsx
import Link from "next/link";
import type { SortKey, SortDir } from "./SortControls";

export default function SortHeader(props: {
  label: string;
  field: SortKey;
  activeSort: SortKey;
  dir: SortDir;
  status?: string;
  q?: string;
  page?: number;
}) {
  const { label, field, activeSort, dir, status, q, page } = props;

  // If clicking the active column, flip direction; otherwise default to "desc"
  const nextDir: SortDir =
    field === activeSort ? (dir === "asc" ? "desc" : "asc") : "desc";

  const qs = new URLSearchParams();
  if (status && status !== "all") qs.set("status", status);
  if (q) qs.set("q", q);
  if (page && page > 1) qs.set("page", String(page));
  qs.set("sort", field);
  qs.set("dir", nextDir);

  const isActive = field === activeSort;
  const arrow = !isActive ? "↕" : dir === "asc" ? "↑" : "↓";

  return (
    <Link
      href={`/invoices?${qs.toString()}`}
      className="inline-flex items-center gap-1 hover:underline"
      title={`Sort by ${label} (${isActive ? nextDir : "desc"})`}
    >
      <span>{label}</span>
      <span aria-hidden="true" className="opacity-70 text-xs">
        {arrow}
      </span>
    </Link>
  );
}
