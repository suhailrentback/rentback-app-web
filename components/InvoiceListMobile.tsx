import Link from "next/link";
import clsx from "clsx";
import StatusBadge from "@/components/StatusBadge";

type Invoice = {
  id: string;
  number: string | null;
  status: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";
  due_at: string | null;
  total: number | null;
  currency: string | null;
  created_at: string | null;
};

export default function InvoiceListMobile({ rows }: { rows: Invoice[] }) {
  if (!rows || rows.length === 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-black/10 dark:border-white/10 p-6"
      >
        <div className="font-medium">No invoices found</div>
        <div className="text-xs opacity-70 mt-1">
          Try a different filter or search query.
        </div>
      </div>
    );
  }

  return (
    <ul role="list" className="space-y-3">
      {rows.map((inv) => {
        const created = inv.created_at
          ? new Date(inv.created_at).toLocaleDateString()
          : "—";
        const due = inv.due_at ? new Date(inv.due_at).toLocaleDateString() : "—";
        const total =
          typeof inv.total === "number"
            ? `${(inv.currency ?? "USD").toUpperCase()} ${(inv.total / 100).toFixed(2)}`
            : "—";

        return (
          <li
            key={inv.id}
            role="listitem"
            className={clsx(
              "relative rounded-2xl border border-black/10 dark:border-white/10 p-4",
              "focus-within:ring-2 focus-within:ring-emerald-500"
            )}
          >
            {/* Clickable card */}
            <Link
              href={`/invoices/${inv.id}`}
              className="absolute inset-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
              aria-label={`View invoice ${inv.number ?? inv.id}`}
            >
              <span className="sr-only">Open invoice</span>
            </Link>

            {/* Visible content */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  {inv.number ?? "—"}
                </div>
                <div className="text-xs opacity-70 mt-0.5">
                  Created: {created} • Due: {due}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm tabular-nums">{total}</div>
                <div className="mt-1 flex justify-end">
                  <StatusBadge status={inv.status} dueAt={inv.due_at} />
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
