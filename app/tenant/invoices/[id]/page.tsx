// app/tenant/invoices/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createRouteSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function TenantInvoiceDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: SearchParams;
}) {
  const supabase = createRouteSupabase();
  const { id } = params;

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(
      "id, number, status, total_amount, currency, description, issued_at, due_date"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !invoice) {
    notFound();
  }

  const backQS = typeof searchParams?.from === "string" && searchParams!.from
    ? `?${searchParams!.from}`
    : "";

  const isPaid = String(invoice.status || "").toLowerCase() === "paid";
  const invoiceUrl = `/api/tenant/invoices/${invoice.id}/pdf`;
  const receiptUrl = `/api/tenant/invoices/${invoice.id}/receipt`;

  const issued = invoice.issued_at
    ? new Date(invoice.issued_at).toDateString()
    : "—";
  const due = invoice.due_date
    ? new Date(invoice.due_date).toDateString()
    : "—";
  const amount =
    typeof invoice.total_amount === "number" ? invoice.total_amount : 0;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/tenant/invoices${backQS}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to invoices
        </Link>
        <Link href="/sign-out" className="text-xs text-gray-500 hover:underline">
          Sign out
        </Link>
      </div>

      <h1 className="text-xl font-semibold">
        Invoice {invoice.number ? `#${invoice.number}` : ""}
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        {invoice.description || "—"} · {String(invoice.status || "").toUpperCase()}
      </p>

      <div className="mt-6 space-y-3 rounded-2xl border p-4">
        <div className="flex items-center gap-2">
          <a
            href={invoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Download invoice (PDF)
          </a>
          <a
            href={receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 ${
              isPaid ? "" : "pointer-events-none opacity-50"
            }`}
          >
            Download receipt (PDF)
          </a>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-gray-500">Total</div>
            <div className="font-medium">
              {amount} {invoice.currency || "PKR"}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Issued</div>
            <div className="font-medium">{issued}</div>
          </div>
          <div>
            <div className="text-gray-500">Due</div>
            <div className="font-medium">{due}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
