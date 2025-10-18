import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

type DbInvoiceRow = {
  id: string;
  number: string | null;
  status: string | null;
  issued_at: string | null;
  due_date: string | null;
  amount_cents: number | null;
  total_amount: number | null;
  currency: string | null;
  description: string | null;
};

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("id, number, status, issued_at, due_date, amount_cents, total_amount, currency, description")
    .eq("id", params.id)
    .returns<DbInvoiceRow>()
    .maybeSingle();

  if (error || !invoice) notFound();

  const isPaid = String(invoice.status ?? "").toLowerCase() === "paid";
  const invoiceUrl = `/api/tenant/invoices/${invoice.id}/pdf`;
  const receiptUrl = `/api/tenant/invoices/${invoice.id}/receipt`;

  const total =
    typeof invoice.total_amount === "number"
      ? invoice.total_amount
      : typeof invoice.amount_cents === "number"
      ? invoice.amount_cents / 100
      : 0;

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <Link href="/tenant/invoices" className="text-sm text-blue-600 hover:underline">
        ← Back to invoices
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">Invoice {invoice.number ?? `#${invoice.id.slice(0,6)}`}</h1>
        <p className="text-sm text-gray-500">
          {invoice.description ?? "—"} · {String(invoice.status ?? "").toUpperCase()}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <a href={invoiceUrl} className="px-4 py-2 rounded bg-gray-900 text-white text-sm">
          Download invoice (PDF)
        </a>
        <a
          href={receiptUrl}
          className={`px-4 py-2 rounded text-sm ${isPaid ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
          aria-disabled={!isPaid}
          onClick={(e) => {
            if (!isPaid) e.preventDefault();
          }}
        >
          Download receipt (PDF)
        </a>
      </div>

      <div className="text-sm text-gray-700">
        <div>Total: {total} {invoice.currency ?? "PKR"}</div>
        <div>Issued: {invoice.issued_at ? new Date(invoice.issued_at).toDateString() : "—"}</div>
        <div>Due: {invoice.due_date ? new Date(invoice.due_date).toDateString() : "—"}</div>
      </div>
    </div>
  );
}
