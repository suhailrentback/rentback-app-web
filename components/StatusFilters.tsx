// components/StatusFilters.tsx
"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import clsx from "clsx";

const OPTIONS = [
  { key: "all", label: "All" },
  { key: "unpaid", label: "Unpaid" }, // ISSUED + OVERDUE
  { key: "overdue", label: "Overdue" },
  { key: "paid", label: "Paid" },
] as const;

export type StatusFilterKey = (typeof OPTIONS)[number]["key"];

export default function StatusFilters() {
  const params = useSearchParams();
  const pathname = usePathname();
  const active = (params.get("status") ?? "all") as StatusFilterKey;

  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => {
        const next = new URLSearchParams(params.toString());
        if (opt.key === "all") next.delete("status");
        else next.set("status", opt.key);
        const href = `${pathname}${next.toString() ? `?${next.toString()}` : ""}`;

        const isActive = active === opt.key || (opt.key === "all" && !params.get("status"));

        return (
          <Link
            key={opt.key}
            href={href}
            className={clsx(
              "rounded-xl px-3 py-1.5 text-sm border",
              isActive
                ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                : "hover:bg-black/5 dark:hover:bg-white/10 border-black/10 dark:border-white/10"
            )}
          >
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}
