// components/InvoiceListMobile.tsx
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";

type Invoice = {
  id: string;
  number: string | null;
  status: InvoiceStatus;
  due_at: string | null;
  total: number | null;
  currency: string | null;
  created_at: string | null;
};

export default function InvoiceListMobile({ rows }: { rows: Invoice[] }) {
  if (!rows || rows.length === 0) return null;

  return (
    <ul className="space-y-3">
      {rows.map((inv) => (
        <li
          key={inv.id}
          className="relative rounded-2xl border border-black/10 dark:border-white/10 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium">
                Invoice {inv.number ? `#${inv.number}` : inv.id.slice(0, 8)}
              </div>
              <div className="text-xs opacity-70 mt-0.5">
                Created{" "}
                {inv.created_at
                  ? new Date(inv.created_at).toLocaleDateString()
                  : "—"}
              </div>
            </div>
            <StatusBadge status={inv.status} dueAt={inv.due_at} />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm font-medium">
              {typeof inv.total === "number"
                ? `${(inv.currency ?? "USD").toUpperCase()} ${(
                    inv.total / 100
                  ).toFixed(2)}`
                : "—"}
            </div>
            <div className="flex items-center gap-2">
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
          </div>
        </li>
      ))}
    </ul>
  );
}
