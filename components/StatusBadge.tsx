// components/StatusBadge.tsx

type Status = "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";

export type StatusBadgeProps = {
  status: Status;
  dueAt?: string | null;
  className?: string;
};

/**
 * Optional helper if you ever want to style rows externally.
 * (Safe to keep even if unused.)
 */
export function overdueRowClass(status: Status, dueAt?: string | null) {
  const isOverdue =
    status === "OVERDUE" ||
    (status !== "PAID" &&
      !!dueAt &&
      !Number.isNaN(Date.parse(dueAt)) &&
      new Date(dueAt).getTime() < Date.now());

  return isOverdue ? "bg-red-500/[0.05]" : "";
}

export default function StatusBadge({ status, dueAt, className }: StatusBadgeProps) {
  const isOverdue =
    status === "OVERDUE" ||
    (status !== "PAID" &&
      !!dueAt &&
      !Number.isNaN(Date.parse(dueAt)) &&
      new Date(dueAt).getTime() < Date.now());

  const palette =
    status === "PAID"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
      : status === "DRAFT"
      ? "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
      : status === "ISSUED"
      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
      : // OVERDUE or computed overdue
        "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200";

  const label = isOverdue && status !== "PAID" ? "OVERDUE" : status;

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        palette,
        className ?? "",
      ].join(" ")}
      aria-label={`Status: ${label}`}
    >
      {label}
    </span>
  );
}
