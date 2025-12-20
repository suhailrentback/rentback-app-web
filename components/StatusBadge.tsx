// components/StatusBadge.tsx
"use client";

type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";

/**
 * Shows a colored pill for invoice status.
 * Adds a native tooltip explaining "overdue" with the due date when applicable.
 */
export default function StatusBadge({
  status,
  dueAt,
}: {
  status: InvoiceStatus;
  dueAt?: string | null;
}) {
  const dueDate =
    typeof dueAt === "string" && dueAt ? new Date(dueAt) : null;

  const isOverdue =
    !!dueDate &&
    isFinite(dueDate.getTime()) &&
    // overdue only matters for non-paid states
    status !== "PAID" &&
    // compare end-of-day to be forgiving across timezones
    endOfDay(dueDate).getTime() < Date.now();

  // Display label favors explicit OVERDUE, else computed overdue, else raw status
  const label: InvoiceStatus =
    status === "OVERDUE" || isOverdue ? "OVERDUE" : status;

  const tone =
    label === "PAID"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
      : label === "ISSUED"
      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
      : label === "OVERDUE"
      ? "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200"
      : "bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-200"; // DRAFT

  const tip =
    label === "OVERDUE" && dueDate
      ? `Invoice is overdue — due ${formatDate(dueDate)}`
      : label === "ISSUED" && dueDate
      ? `Issued — due ${formatDate(dueDate)}`
      : label === "PAID"
      ? "Paid"
      : "Draft";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}
      title={tip}
      aria-label={tip}
      data-status={label}
    >
      {label}
    </span>
  );
}

function formatDate(d: Date) {
  // Example: "Jan 05, 2026"
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function endOfDay(d: Date) {
  const e = new Date(d);
  e.setHours(23, 59, 59, 999);
  return e;
}
