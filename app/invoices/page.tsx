import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import ReceiptButton from "@/components/ReceiptButton";
import StatusChip from "@/components/StatusChip";
import StatusFilters, { type StatusFilterKey } from "@/components/StatusFilters";
import InvoiceSearch from "@/components/InvoiceSearch";
import { cookies } from "next/headers";
import Pagination from "@/components/Pagination";
import SortControls, { type SortKey, type SortDir } from "@/components/SortControls";
import { createServerClient } from "@supabase/ssr";


type Invoice = {
  id: string;
  number: string;
  periodLabel: string; // e.g., "Nov 2025"
  issuedAt: string;    // ISO
  dueAt: string;       // ISO
  totalCents: number;
  currency: "PKR" | "USD";
  status: "ISSUED" | "PAID" | "OVERDUE";
};

const INVOICES: Invoice[] = [
  {
    id: "inv_demo_001",
    number: "RB-2025-1101",
    periodLabel: "Nov 2025",
    issuedAt: "2025-11-01T10:00:00.000Z",
    dueAt: "2025-11-10T23:59:59.000Z",
    totalCents: 125000, // PKR 1,250.00 demo
    currency: "PKR",
    status: "PAID",
  },
  {
    id: "inv_demo_002",
    number: "RB-2025-1201",
    periodLabel: "Dec 2025",
    issuedAt: "2025-12-01T10:00:00.000Z",
    dueAt: "2025-12-10T23:59:59.000Z",
    totalCents: 135000,
    currency: "PKR",
    status: "ISSUED",
  },
  {
    id: "inv_demo_003",
    number: "RB-2025-1202",
    periodLabel: "Dec 2025 (Adj.)",
    issuedAt: "2025-12-05T10:00:00.000Z",
    dueAt: "2025-12-12T23:59:59.000Z",
    totalCents: 25000,
    currency: "PKR",
    status: "OVERDUE",
  },
];

function fmtMoney(amountCents: number, currency: "PKR" | "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

export default function MyInvoicesPage() {
  const outstanding = INVOICES.filter(
    (i) => i.status === "ISSUED" || i.status === "OVERDUE"
  ).reduce((sum, i) => sum + i.totalCents, 0);

  const overdueCount = INVOICES.filter((i) => i.status === "OVERDUE").length;

  return (
    <section className="p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Invoices</h1>
          <p className="text-sm opacity-70">
            A read-only demo list. Each row links to invoice details and a PDF receipt.
          </p>
        </div>
        <div className="text-sm">
          <div className="flex items-center gap-3">
            <span className="opacity-70">{INVOICES.length} total</span>
            <span className={overdueCount ? "text-rose-600 dark:text-rose-300" : "opacity-70"}>
              {overdueCount} overdue
            </span>
            <span className="font-medium">
              Outstanding: {fmtMoney(outstanding, "PKR")}
            </span>
          </div>
        </div>
    </div>

      <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-black/5 dark:bg-white/5">
            <tr>
              <th className="text-left p-3 font-medium">Invoice</th>
              <th className="text-left p-3 font-medium">Period</th>
              <th className="text-left p-3 font-medium">Issued</th>
              <th className="text-left p-3 font-medium">Due</th>
              <th className="text-right p-3 font-medium">Total</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {INVOICES.length === 0 ? (
              <tr>
                <td className="p-6 text-center opacity-70" colSpan={7}>
                  No invoices yet.
                </td>
              </tr>
            ) : (
              INVOICES.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-t border-black/5 dark:border-white/10"
                >
                  <td className="p-3">
                    <Link
                      href={`/invoices/${encodeURIComponent(inv.id)}`}
                      className="underline underline-offset-2 hover:opacity-80"
                    >
                      {inv.number}
                    </Link>
                  </td>
                  <td className="p-3">{inv.periodLabel}</td>
                  <td className="p-3">
                    {new Date(inv.issuedAt).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    {new Date(inv.dueAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    {fmtMoney(inv.totalCents, inv.currency)}
                  </td>
                  <td className="p-3">
                    <StatusChip status={inv.status} />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/invoices/${encodeURIComponent(inv.id)}`}
                        className="rounded-xl px-3 py-2 border hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        View
                      </Link>
                      <ReceiptButton
                        invoiceId={inv.id}
                        label="Receipt"
                        variant="button"
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
