'use client';

type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE';

export default function StatusBadge({
  status,
  dueAt,
}: {
  status: InvoiceStatus;
  dueAt?: string | null;
}) {
  const isOverdue =
    status !== 'PAID' &&
    !!dueAt &&
    !Number.isNaN(new Date(dueAt).getTime()) &&
    new Date(dueAt) < new Date();

  const label: InvoiceStatus = isOverdue && status !== 'PAID' ? 'OVERDUE' : status;

  const cls =
    label === 'PAID'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
      : label === 'ISSUED'
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
      : label === 'DRAFT'
      ? 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-200'
      : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200';

  return (
    <span
      className={
        'px-2 py-0.5 rounded-lg text-xs font-medium inline-flex items-center ' + cls
      }
    >
      {label}
    </span>
  );
}
