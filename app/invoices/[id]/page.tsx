// app/invoices/[id]/page.tsx
import Link from "next/link";

export const dynamic = "force-dynamic";

type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";

type InvoiceRow = {
  id: string;
  number: string;
  title: string;
  issued_at: string; // ISO
  due_date: string;  // ISO
  total_cents: number;
  currency: string;  // "USD" | "PKR" | ...
  status: InvoiceStatus;
  landlord_name?: string | null;
};

type InvoiceItem = {
  id: string;
  description: string;
  qty: number;
  unit_cents: number;
  total_cents: number;
};

type PageProps = { params: { id: string } };

export default async function InvoiceDetailPage({ params }: PageProps) {
  const id = params.id;

  // DEMO mode: show stub data unless NEXT_PUBLIC_DEMO === "false"
  const demo =
    (process.env.NEXT_PUBLIC_DEMO ?? "true").toLowerCase() !== "false";

  let invoice: InvoiceRow | null = null;
  let items: InvoiceItem[] = [];

  if (demo) {
    invoice = demoInvoices().find((r) => r.id === id) ?? null;
    if (invoice) items = demoItemsFor(invoice);
  } else {
    // Non-demo placeholder to keep builds green until DB is wired.
    invoice = null;
    items = [];
  }

  if (!invoice) {
    return (
      <section className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Invoice</h1>
          <Link
            href="/invoices"
            className="rounded-xl px-3 py-2 border text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            Back to list
          </Link>
        </div>
        <div className="rounded-2xl border p-6">
          <p className="opacity-70">
            Invoice not found. (In demo, open from the list at <code>/invoices</code>.)
          </p>
        </div>
      </section>
    );
  }

  // Totals
  const subTotal = items.reduce((s, it) => s + it.total_cents, 0);
  const taxCents = 0; // demo
  const grandTotal = invoice.total_cents;
  const outstanding =
    invoice.status === "PAID" ? 0 : Math.max(0, grandTotal); // demo-friendly

  return (
    <section className="p-6 space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Invoice {invoice.number}</h1>
          <p className="text-sm opacity-70">
            {invoice.title} · Issued {fmtDate(invoice.issued_at)} · Due{" "}
            {fmtDate(invoice.due_date)}
          </p>
          <p className="text-sm opacity-70">
            Landlord: {invoice.landlord_name ?? "—"}
          </p>
        </div>
        <div className="text-right space-y-2">
          <div>{StatusBadge(invoice.status)}</div>
          <Link
            href="/invoices"
            className="inline-block rounded-xl px-3 py-2 border text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            Back to list
          </Link>
        </div>
      </header>

      {/* Amounts card */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl border p-4">
          <div className="text-xs opacity-70">Total</div>
          <div className="text-xl font-semibold">
            {fmtMoney(grandTotal, invoice.currency)}
          </div>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-xs opacity-70">Outstanding</div>
          <div className="text-xl font-semibold">
            {fmtMoney(outstanding, invoice.currency)}
          </div>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-xs opacity-70">Status</div>
          <div>{StatusBadge(invoice.status)}</div>
        </div>
      </div>

      {/* Items */}
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
            {items.length === 0 ? (
              <tr>
                <td className="p-3" colSpan={4}>
                  No line items.
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr
                  key={it.id}
                  className="border-t border-black/5 dark:border-white/10"
                >
                  <td className="p-3">{it.description}</td>
                  <td className="p-3 text-right">{it.qty}</td>
                  <td className="p-3 text-right">
                    {fmtMoney(it.unit_cents, invoice.currency)}
                  </td>
                  <td className="p-3 text-right">
                    {fmtMoney(it.total_cents, invoice.currency)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-black/5 dark:border-white/10">
              <td className="p-3" colSpan={3}>
                Subtotal
              </td>
              <td className="p-3 text-right">
                {fmtMoney(subTotal, invoice.currency)}
              </td>
            </tr>
            <tr className="border-t border-black/5 dark:border-white/10">
              <td className="p-3" colSpan={3}>
                Tax
              </td>
              <td className="p-3 text-right">
                {fmtMoney(taxCents, invoice.currency)}
              </td>
            </tr>
            <tr className="border-t border-black/5 dark:border-white/10">
              <td className="p-3 font-medium" colSpan={3}>
                Total
              </td>
              <td className="p-3 text-right font-medium">
                {fmtMoney(grandTotal, invoice.currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          disabled={invoice.status !== "PAID"}
          title={
            invoice.status === "PAID"
              ? "Receipt downloadable (hooked up in Step 3)"
              : "Available after payment"
          }
          className={`rounded-xl px-3 py-2 border text-sm ${
            invoice.status !== "PAID"
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-black/5 dark:hover:bg-white/10"
          }`}
        >
          Download receipt (PDF)
        </button>

        <button
          disabled
          title="PSP / Mark-as-Paid arrives in Step 4"
          className="rounded-xl px-3 py-2 border text-sm opacity-50 cursor-not-allowed"
        >
          Pay now (coming soon)
        </button>
      </div>
    </section>
  );
}

/** Demo data & helpers */

function demoInvoices(): InvoiceRow[] {
  const now = Date.now();
  const days = (n: number) => new Date(now + n * 24 * 3600 * 1000).toISOString();
  const base = (i: number, status: InvoiceStatus, dIssue: number, dDue: number): InvoiceRow => ({
    id: `inv_${i}`,
    number: `RB-${2025}-${String(i).padStart(4, "0")}`,
    title: `Monthly Rent #${i}`,
    issued_at: days(dIssue),
    due_date: days(dDue),
    total_cents: 85000 * 100, // 85,000 PKR
    currency: "PKR",
    status,
    landlord_name: "ABC Properties",
  });
  const arr: InvoiceRow[] = [];
  arr.push(base(1, "PAID", -60, -45));
  arr.push(base(2, "PAID", -30, -15));
  arr.push(base(3, "ISSUED", -5, +10));
  arr.push(base(4, "OVERDUE", -40, -5));
  arr.push(base(5, "DRAFT", 0, +15));
  for (let i = 6; i <= 26; i++) {
    const mod = i % 4;
    const st: InvoiceStatus = mod === 0 ? "PAID" : mod === 1 ? "ISSUED" : mod === 2 ? "OVERDUE" : "DRAFT";
    arr.push(base(i, st, -i, 10 - (i % 20)));
  }
  return arr;
}

function demoItemsFor(inv: InvoiceRow): InvoiceItem[] {
  // Make items sum to inv.total_cents
  const rent = 80000 * 100;
  const maintenance = 5000 * 100;
  const sum = rent + maintenance;
  const diff = Math.max(0, inv.total_cents - sum); // padding line to match total
  const items: InvoiceItem[] = [
    { id: `${inv.id}_1`, description: "Monthly Rent", qty: 1, unit_cents: rent, total_cents: rent },
    { id: `${inv.id}_2`, description: "Maintenance / Services", qty: 1, unit_cents: maintenance, total_cents: maintenance },
  ];
  if (diff > 0) {
    items.push({
      id: `${inv.id}_3`,
      description: "Adjustments",
      qty: 1,
      unit_cents: diff,
      total_cents: diff,
    });
  }
  return items;
}

function StatusBadge(s: InvoiceStatus) {
  const base = "inline-block text-xs px-2 py-1 rounded-full border";
  switch (s) {
    case "PAID":
      return <span className={`${base} border-emerald-400`}>Paid</span>;
    case "OVERDUE":
      return <span className={`${base} border-red-400`}>Overdue</span>;
    case "ISSUED":
      return <span className={`${base} border-amber-400`}>Issued</span>;
    case "DRAFT":
    default:
      return <span className={`${base} border-slate-400`}>Draft</span>;
  }
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}
function fmtMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(
      cents / 100
    );
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}
