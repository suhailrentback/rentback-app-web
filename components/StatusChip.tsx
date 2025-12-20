"use client";

type Status = "ISSUED" | "PAID" | "OVERDUE";

export default function StatusChip({ status }: { status: Status }) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium";

  const styles: Record<Status, string> = {
    ISSUED:
      "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300 border border-amber-200/60 dark:border-amber-400/20",
    PAID:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-400/20",
    OVERDUE:
      "bg-rose-100 text-rose-800 dark:bg-rose-400/10 dark:text-rose-300 border border-rose-200/60 dark:border-rose-400/20",
  };

  return <span className={`${base} ${styles[status]}`}>{status}</span>;
}
