// components/StatusBadge.tsx
// Self-contained & typed so comparisons are always valid.

export type Status = "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";

export type StatusBadgeProps = {
  status: Status;
  dueAt?: string | null;
  className?: string;
};

/** Optional helper for zebra/row styling when overdue by date. */
export function overdueRowClass(status: Status, dueAt?: string | null) {
  const isOverdue =
    status !== "PAID" &&
    !!dueAt &&
    !Number.isNaN(Date.parse(dueAt)) &&
    new Date(dueAt).getTime() < Date.now();
  return isOverdue || status === "OVERDUE" ? "bg-rose-500/[0.05]" : "";
}

export default function StatusBadge({ status, dueAt, className }: StatusBadgeProps) {
  const isOverdueByDate =
    !!dueAt &&
    !Number.isNaN(Date.parse(dueAt)) &&
    new Date(dueAt).getTime() < Date.now();

  // If paid, always show PAID. Otherwise, overdue-by-date shows OVERDUE.
  const effective: Status =
    status === "PAID" ? "PAID" : isOverdueByDate ? "OVERDUE" : status;

  const palette =
    effective === "PAID"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
      : effective === "DRAFT"
      ? "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
      : effective === "ISSUED"
      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
      : // OVERDUE
        "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        palette,
        className ?? "",
      ].join(" ")}
      aria-label={`Status: ${effective}`}
    >
      {effective}
    </span>
  );
}
