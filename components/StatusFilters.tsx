// components/StatusFilters.tsx
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export type StatusFilterKey = "all" | "unpaid" | "overdue" | "paid";

const OPTIONS: { key: StatusFilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unpaid", label: "Unpaid" },
  { key: "overdue", label: "Overdue" },
  { key: "paid", label: "Paid" },
];

export default function StatusFilters() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const active = (sp?.get("status") as StatusFilterKey) ?? "all";

  const makeHref = (key: StatusFilterKey) => {
    const params = new URLSearchParams(sp?.toString() ?? "");
    // When changing filter, reset to page 1
    params.set("page", "1");

    if (key === "all") params.delete("status");
    else params.set("status", key);

    return `${pathname}?${params.toString()}`;
  };

  return (
    <div role="tablist" aria-label="Filter invoices by status" className="flex items-center gap-2">
      {OPTIONS.map((opt) => {
        const selected = opt.key === active;
        return (
          <Link
            key={opt.key}
            href={makeHref(opt.key)}
            role="tab"
            aria-selected={selected}
            aria-current={selected ? "page" : undefined}
            className={`rounded-xl px-3 py-1.5 border text-xs focus-visible:outline-none
                        focus-visible:ring-2 focus-visible:ring-emerald-500
                        focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black
                        hover:bg-black/5 dark:hover:bg-white/10
                        ${selected ? "bg-black/5 dark:bg-white/10 font-medium" : ""}`}
          >
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}
