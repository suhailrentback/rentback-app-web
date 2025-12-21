import clsx from "clsx";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

type Status = "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";

export default function StatusBadge({
  status,
  dueAt,
  lang = "en",
}: {
  status: Status;
  dueAt?: string | null;
  lang?: Lang;
}) {
  // Only consider overdue if it's not already PAID
  const isOverdue =
    !!dueAt && status !== "PAID" && new Date(dueAt).getTime() < Date.now();

  const label = isOverdue
    ? t(lang, "status_OVERDUE")
    : t(lang, `status_${status}` as any);

  const colorClass =
    status === "PAID"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
      : status === "ISSUED"
      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
      : status === "OVERDUE" || isOverdue
      ? "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200"
      : "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-200";

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        colorClass
      )}
    >
      {label}
    </span>
  );
}
