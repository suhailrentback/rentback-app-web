import Link from "next/link";
import { notFound } from "next/navigation";
import ReceiptButton from "@/components/ReceiptButton";
import StatusChip from "@/components/StatusChip";

type Status = "ISSUED" | "PAID" | "OVERDUE";
type Currency = "PKR" | "USD";

type LineItem = {
  description: string;
  qty: number;
  unitCents: number;
};

type InvoiceDetail = {
  id: string;
  number: string;
  status: Status;
  currency: Currency;
  issuedAt: string; // ISO
  dueAt: string; // ISO
  billTo: {
    name: string;
    email?: string;
    addressLines?: string[];
  };
  lineItems: LineItem[];
  notes?: string;
};

// --- Demo data (kept in sync with /invoices list) ---
const DEMO: Record<string, InvoiceDetail> = {
  inv_demo_001: {
    id: "inv_demo_001",
    number: "RB-2025-1101",
    status: "PAID",
    currency: "PKR",
    issuedAt: "2025-11-01T10:00:00.000Z",
    dueAt: "2025-11-10T23:59:59.000Z",
    billTo: {
      name: "Suhail Ahmed",
      email: "tenant@example.com",
      addressLines: ["Unit 2B, Pearl Residency", "Karachi, Pakistan"],
    },
    lineItems: [
      { description: "Monthly Rent — Nov 2025", qty: 1, unitCents: 120000 },
      { description: "Maintenance (fixed)", qty: 1, unitCents: 5000 },
    ],
    notes: "Thank you — this invoice is fully paid.",
  },
  inv_demo_002: {
    id: "inv_demo_002",
    number: "RB-2025-1201",
    status: "ISSUED",
    currency: "PKR",
    issuedAt: "2025-12-01T10:00:00.000Z",
    dueAt: "2025-12-10T23:59:59.000Z",
    billTo: {
      name: "Suhail Ahmed",
      email: "tenant@example.com",
      addressLines: ["Unit 2B, Pearl Residency", "Karachi, Pakistan"],
    },
    lineItems: [
      { description: "Monthly Rent — Dec 2025", qty: 1, unitCents: 130000 },
      { description: "Maintenance (fixed)", qty: 1, unitCents: 5000 },
    ],
    notes: "Please pay on or before the due date to avoid late fees.",
  },
  inv_demo_003: {
    id: "inv_demo_003",
    number: "RB-2025-1202",
    status: "OVERDUE",
    currency: "PKR",
    issuedAt: "2025-12-05T10:00:00.000Z",
    dueAt: "2025-12-12T23:59:59.000Z",
    billTo: {
      name: "Suhail Ahmed",
      email: "tenant@example.com",
      addressLines: ["Unit 2B, Pearl Residency", "Karachi, Pakistan"],
    },
    lineItems: [{ description: "Adjustment — Utilities", qty: 1, unitCents: 25000 }],
    notes: "This invoice is overdue. Please settle immediately.",
  },
};

function fmtMoney(amountCents: number, currency: Currency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

function totals(inv: InvoiceDetail) {
  const subtotal = inv.lineItems.reduce((sum, i) => sum + i.qty * i.unitCents, 0);
  // demo: no tax; wire later if needed
  const tax = 0;
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const inv = DEMO[params.id];
  if (!inv) return notFound();

  const { subtotal, tax, total } = totals(inv);

  return (
    <section className="p-6 space-y-6">
      {/* Breadcrumb + actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="text-sm">
            <Link href="/invoices" className="underline underline-offset-2 hover:opacity-80">
              ← Back to Invoices
            </Link>
          </div>
          <h1 className="text-2xl font-semibold">
            Invoice {inv.number}{" "}
            <span className="align-middle ml-2">
              <StatusChip status={inv.status} />
            </span>
          </h1>
          <p className="text-sm opacity-70">
            Issued {new Date(inv.issuedAt).toLocaleDateString()} • Due{" "}
            {new Date(inv.dueAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <ReceiptButton invoiceId={inv.id} label="Receipt (PDF)" variant="button" />
        </div>
      </div>

      {/* Bill-to + meta */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4">
          <h2 className="font-medium mb-2">Bill To</h2>
          <div className="text-sm leading-6">
            <div className="font-medium">{inv.billTo.name}</div>
            {inv.billTo.email ? <div className="opacity-80">{inv.billTo.email}</div> : null}
            {inv.billTo.addressLines?.map((l, i) => (
              <div key={i} className="opacity-80">
                {l}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4">
          <h2 className="font-medium mb-2">Invoice Info</h2>
          <dl className="text-sm grid grid-cols-2 gap-y-2">
            <dt className="opacity-70">Invoice #</dt>
            <dd className="text-right">{inv.number}</dd>

            <dt className="opacity-70">Issued</dt>
            <dd className="text-right">{new Date(inv.issuedAt).toLocaleDateString()}</dd>

            <dt className="opacity-70">Due</dt>
            <dd className="text-right">{new Date(inv.dueAt).toLocaleDateString()}</dd>

            <dt className="opacity-70">Currency</dt>
            <dd className="text-right">{inv.currency}</dd>
          </dl>
        </div>
      </div>

      {/* Line items */}
      <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-black/5 dark:bg-white/5">
            <tr>
              <th className="text-left p-3 font-medium">Description</th>
              <th className="text-right p-3 font-medium">Qty</th>
              <th className="text-right p-3 font-medium">Unit</th>
              <th className="text-right p-3 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.lineItems.map((li, idx) => (
              <tr key={idx} className="border-t border-black/5 dark:border-white/10">
                <td className="p-3">{li.description}</td>
                <td className="p-3 text-right">{li.qty}</td>
                <td className="p-3 text-right">{fmtMoney(li.unitCents, inv.currency)}</td>
                <td className="p-3 text-right">
                  {fmtMoney(li.qty * li.unitCents, inv.currency)}
                </td>
              </tr>
            ))}

            {/* Totals */}
            <tr className="border-t border-black/5 dark:border-white/10">
              <td className="p-3" colSpan={3}>
                Subtotal
              </td>
              <td className="p-3 text-right">{fmtMoney(subtotal, inv.currency)}</td>
            </tr>
            <tr className="border-t border-black/5 dark:border-white/10">
              <td className="p-3" colSpan={3}>
                Tax
              </td>
              <td className="p-3 text-right">{fmtMoney(tax, inv.currency)}</td>
            </tr>
            <tr className="border-t border-black/5 dark:border-white/10">
              <td className="p-3 font-medium" colSpan={3}>
                Total
              </td>
              <td className="p-3 text-right font-medium">
                {fmtMoney(total, inv.currency)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {inv.notes ? (
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 text-sm">
          <h3 className="font-medium mb-1">Notes</h3>
          <p className="opacity-80">{inv.notes}</p>
        </div>
      ) : null}
    </section>
  );
}
