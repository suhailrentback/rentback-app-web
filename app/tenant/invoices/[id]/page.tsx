// app/tenant/invoices/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server"; // uses your existing server helper

function formatMoney(raw: any, currency?: string) {
  // supports either amount_cents or amount
  let amount = 0;
  if (typeof raw?.amount_cents === "number") amount = raw.amount_cents / 100;
  else if (typeof raw?.amount === "number") amount = raw.amount;
  const cur = (raw?.currency || currency || "PKR") as string;
  try {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${cur} ${Math.round(amount).toLocaleString()}`;
  }
}

function badge(status?: string) {
  const s = (status || "").toLowerCase();
  const base = "rounded-full px-2.5 py-1 text-xs font-medium ring-1";
  if (s === "paid") return <span className={`${base} bg-emerald-50 text-emerald-700 ring-emerald-200`}>PAID</span>;
  if (s === "overdue") return <span className={`${base} bg-red-50 text-red-700 ring-red-200`}>OVERDUE</span>;
  return <span className={`${base} bg-amber-50 text-amber-800 ring-amber-200`}>{(s || "ISSUED").toUpperCase()}</span>;
}

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !invoice) notFound();

  const title = invoice.number || `Invoice ${invoice.id}`;
  const amount = formatMoney(invoice);
  const due = invoice.due_date ? new Date(invoice.due_date) : null;
  const created = invoice.created_at ? new Date(invoice.created_at) : null;

  // Try a few common keys for stored PDF URLs (optional in your schema)
  const invoicePdfUrl =
    invoice.invoice_pdf_url ||
    invoice.invoice_url ||
    invoice.pdf_url ||
    "";

  const receiptPdfUrl =
    invoice.receipt_pdf_url ||
    invoice.receipt_url ||
    "";

  const isPaid = String(invoice.status || "").toLowerCase() === "paid";

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Top: Back + Title */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoice</h1>
          <p className="mt-1 text-sm text-gray-500">Transparent details and quick downloads.</p>
        </div>
        <Link
          href="/tenant/invoices"
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        >
          Back to invoices
        </Link>
      </div>

      {/* Summary card */}
      <div className="mt-6 rounded-2xl border p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">Number</div>
            <div className="text-base font-semibold">{title}</div>
          </div>
          <div>{badge(invoice.status)}</div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border p-4">
            <div className="text-xs text-gray-500">Amount</div>
            <div className="mt-1 text-lg font-semibold">{amount}</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-xs text-gray-500">Due date</div>
            <div className="mt-1 text-base font-medium">
              {due ? due.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
            </div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-xs text-gray-500">Created</div>
            <div className="mt-1 text-base font-medium">
              {created ? created.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
            </div>
          </div>
        </div>

        {/* Optional meta (only shown if present) */}
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {"tenant_email" in invoice && invoice.tenant_email && (
            <div className="rounded-xl border p-4">
              <div className="text-xs text-gray-500">Tenant</div>
              <div className="mt-1 text-base font-medium">{invoice.tenant_email}</div>
            </div>
          )}
          {"period_start" in invoice && invoice.period_start && (
            <div className="rounded-xl border p-4">
              <div className="text-xs text-gray-500">Period start</div>
              <div className="mt-1 text-base font-medium">
                {new Date(invoice.period_start).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </div>
            </div>
          )}
          {"period_end" in invoice && invoice.period_end && (
            <div className="rounded-xl border p-4">
              <div className="text-xs text-gray-500">Period end</div>
              <div className="mt-1 text-base font-medium">
                {new Date(invoice.period_end).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {invoicePdfUrl ? (
            <a
              href={invoicePdfUrl as string}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              View invoice PDF
            </a>
          ) : (
            <button
              disabled
              className="cursor-not-allowed rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-400 shadow-sm ring-1 ring-gray-200"
              title="No invoice PDF attached"
            >
              View invoice PDF
            </button>
          )}

          {isPaid && receiptPdfUrl ? (
            <a
              href={receiptPdfUrl as string}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              Download receipt
            </a>
          ) : (
            <button
              disabled
              className="cursor-not-allowed rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-400"
              title={isPaid ? "No receipt attached yet" : "Receipt available after payment"}
            >
              Download receipt
            </button>
          )}
        </div>
      </div>

      {/* Raw debug (toggle by uncommenting if needed) */}
      {/* <pre className="mt-6 overflow-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-700">
        {JSON.stringify(invoice, null, 2)}
      </pre> */}
    </div>
  );
}
