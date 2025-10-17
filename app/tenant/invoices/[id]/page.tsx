// app/tenant/invoices/[id]/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

type PageProps = { params: { id: string } };

function formatMoney(amount?: number, currency?: string) {
  const cur = currency || "PKR";
  const num = typeof amount === "number" ? amount : 0;
  try {
    return new Intl.NumberFormat("en-PK", { style: "currency", currency: cur }).format(num);
  } catch {
    return `${cur} ${num.toLocaleString()}`;
  }
}

export default async function TenantInvoiceDetailPage({ params }: PageProps) {
  const supabase = createServerSupabase();

  // Ensure user is signed in (server-side check)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=/tenant/invoices/${params.id}`);

  // Fetch the invoice this user can see (RLS protects)
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(
      [
        "id",
        "number",
        "status",
        "amount",
        "currency",
        "due_date",
        "issued_at",
        "paid_at",
        "landlord_name",
        "landlord_email",
        "tenant_email",
        "notes"
      ].join(",")
    )
    .eq("id", params.id)
    .single();

  if (error || !invoice) notFound();

  const isPaid = String(invoice.status).toLowerCase() === "paid";
  const invoiceUrl = `/api/tenant/invoices/${invoice.id}/pdf`;
  const receiptUrl = `/api/tenant/invoices/${invoice.id}/receipt`;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="text-xs font-semibold text-emerald-700">Tenant</div>
        <Link href="/tenant/invoices" className="text-sm text-emerald-700 hover:underline">
          ← Back to invoices
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Invoice #{invoice.number ?? invoice.id}</h1>
      <p className="mt-1 text-sm text-gray-500">
        Status: <span className="font-medium text-gray-800">{String(invoice.status).toUpperCase()}</span>
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border p-4">
          <div className="text-xs text-gray-500">Amount</div>
          <div className="text-lg font-semibold">{formatMoney(invoice.amount, invoice.currency)}</div>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-xs text-gray-500">Due</div>
          <div className="text-lg font-semibold">
            {invoice.due_date ? new Date(invoice.due_date).toDateString() : "—"}
          </div>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-xs text-gray-500">Issued</div>
          <div className="text-lg font-semibold">
            {invoice.issued_at ? new Date(invoice.issued_at).toDateString() : "—"}
          </div>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-xs text-gray-500">Paid</div>
          <div className="text-lg font-semibold">
            {invoice.paid_at ? new Date(invoice.paid_at).toDateString() : (isPaid ? "Yes" : "No")}
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div className="mt-6 rounded-2xl border p-4">
          <div className="text-xs text-gray-500">Notes</div>
          <div className="mt-1 text-sm text-gray-800">{invoice.notes}</div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={invoiceUrl}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        >
          Download invoice (PDF)
        </a>

        <a
          href={receiptUrl}
          aria-disabled={!isPaid}
          className={`rounded-lg px-4 py-2 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 ${
            isPaid
              ? "bg-white text-gray-900 ring-emerald-600 hover:bg-gray-50 border border-gray-300"
              : "pointer-events-none bg-gray-100 text-gray-400 border border-gray-200"
          }`}
          title={isPaid ? "Download paid receipt" : "Receipt available once paid"}
        >
          Download receipt (PDF)
        </a>
      </div>
    </div>
  );
}
