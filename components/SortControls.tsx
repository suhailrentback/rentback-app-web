// components/SortControls.tsx
"use client";

import Link from "next/link";
import clsx from "clsx";

export type SortKey = "created_at" | "due_at" | "number" | "total";
export type SortDir = "asc" | "desc";
export type StatusFilterKey = "all" | "unpaid" | "overdue" | "paid";

type ToolbarProps = {
  sort: SortKey;
  dir: SortDir;
  status?: StatusFilterKey;
  q?: string;
  page: number;
};

type HeaderProps = {
  label: string;
  field: SortKey;
  activeSort: SortKey;
  dir: SortDir;
  status?: StatusFilterKey;
  q?: string;
  page: number;
};

function makeHref(params: {
  sort?: SortKey;
  dir?: SortDir;
  status?: StatusFilterKey;
  q?: string;
  page?: number;
}) {
  const url = new URL("/invoices", typeof window === "undefined" ? "http://localhost" : window.location.origin);
  if (params.sort) url.searchParams.set("sort", params.sort);
  if (params.dir) url.searchParams.set("dir", params.dir);
  if (params.status && params.status !== "all") url.searchParams.set("status", params.status);
  if (params.q) url.searchParams.set("q", params.q);
  url.searchParams.set("page", String(params.page ?? 1));
  return url.pathname + "?" + url.searchParams.toString();
}

export default function SortControls({ sort, dir, status, q, page }: ToolbarProps) {
  const toggled = dir === "asc" ? "desc" : "asc";
  const href = makeHref({ sort, dir: toggled, status, q, page });

  return (
    <div className="hidden md:flex items-center gap-2">
      <Link
        href={href}
        className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                   focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
        aria-label={`Toggle sort direction (${toggled})`}
      >
        {dir === "asc" ? "Asc ↑" : "Desc ↓"}
      </Link>
    </div>
  );
}

export function SortHeader({
  label,
  field,
  activeSort,
  dir,
  status,
  q,
  page,
}: HeaderProps) {
  const isActive = activeSort === field;
  const nextDir: SortDir = isActive ? (dir === "asc" ? "desc" : "asc") : "desc";
  const href = makeHref({ sort: field, dir: nextDir, status, q, page });

  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center gap-1 rounded-lg px-2 py-1 -mx-2",
        "hover:bg-black/5 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      )}
      aria-label={`Sort by ${label} ${isActive ? `(now ${dir}, next ${nextDir})` : ""}`}
    >
      <span>{label}</span>
      <span className="text-[10px] opacity-60">
        {isActive ? (dir === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </Link>
  );
}
