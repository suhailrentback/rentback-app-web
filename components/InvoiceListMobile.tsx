// components/InvoiceListMobile.tsx
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import clsx from "clsx";

export type MobileInvoice = {
  id: string;
  number: string | null;
  status: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";
  due_at: string | null;
  total: number | null;
  currency: string | null;
  created_at: string | null;
};

function isOverdue(status: MobileInvoice["status"]) {
  return status === "OVERDUE";
}

export default function InvoiceListMobile({ rows }: { rows: MobileInvoice[] }) {
  if (!rows?.length) return null;

  return (
    <ul className="space-y-3">
      {rows.map((inv) => {
        const amount =
          typeof inv.total === "number"
            ? `${(inv.currency ?? "USD").toUpperCase()} ${(inv.total / 100).toFixed(2)}`
            : "—";

        return (
          <li
            key={inv.id}
            className={clsx(
              "rounded-2xl border border-black/10 dark:border-white/10 p-4 transition-shadow",
              "bg-white/60 dark:bg-black/30 backdrop-blur",
              "focus-within:ring-2 focus-within:ring-emerald-500",
              "focus-within:ring-offset-2 focus-within:ring-offset-white dark:focus-within:ring-offset-black",
              isOverdue(inv.status) && "ring-1 ring-red-500/30"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm opacity-60">Invoice</div>
                <div className="text-base font-semibold">{inv.number ?? "—"}</div>
              </div>
              <StatusBadge status={inv.status} dueAt={inv.due_at} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="opacity-60">Created</div>
              <div className="text-right">
                {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "—"}
              </div>

              <div className="opacity-60">Due</div>
              <div className="text-right">
                {inv.due_at ? new Date(inv.due_at).toLocaleDateString() : "—"}
              </div>

              <div className="opacity-60">Total</div>
              <div className="text-right tabular-nums">{amount}</div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <Link
                href={`/invoices/${inv.id}`}
                className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                           focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
              >
                View
              </Link>
              <a
                href={`/api/receipts/${inv.id}`}
                className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                           focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
              >
                PDF
              </a>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
