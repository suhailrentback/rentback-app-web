import clsx from "clsx";
import { t, type Lang } from "@/lib/i18n";

// Canonical status union used across the app
export type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";

type Props = {
  status: InvoiceStatus;
  /** ISO date string */
  dueAt?: string | null;
  /** Optional language hint for label translation */
  lang?: Lang;
};

/**
 * Small pill showing the current invoice status.
 * If there's a due date in the past AND the invoice isn't paid,
 * we surface "OVERDUE" regardless of the stored status.
 */
export default function StatusBadge({ status, dueAt, lang }: Props) {
  const isPastDue = !!dueAt && new Date(dueAt) < new Date();

  // Respect PAID first; otherwise mark past-due items as OVERDUE, else show stored status.
  const label: InvoiceStatus =
    status === "PAID" ? "PAID" : isPastDue ? "OVERDUE" : status;

  const cls =
    label === "PAID"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
      : label === "OVERDUE"
      ? "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200"
      : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200";

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        cls
      )}
    >
      {t(lang, `status_${label}` as any)}
    </span>
  );
}

// Optional class you can use to tint overdue table rows (kept for compatibility)
export const overdueRowClass = "bg-red-500/[0.05]";
