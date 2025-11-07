// app/tenant/invoices/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

type InvoiceRow = {
  id: string;
  number: string | null;
  status: string | null; // 'open' | 'paid'
  issued_at: string | null;
  due_date: string | null;
  total_amount: number | null;
  amount_cents: number | null;
  currency: string | null;
  description: string | null;
};

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(dt);
}

function safeCurrency(c: string | null | undefined) {
  const v = (c ?? "PKR").toUpperCase().trim();
  return v || "PKR";
}

function fmtAmount(
  total: number | null | undefined,
  cents: number | null | undefined,
  currency: string | null | undefined
) {
  const cur = safeCurrency(currency);
  const n =
    typeof total === "number"
      ? total
      : typeof cents === "number"
      ? Math.round(cents) / 100
      : 0;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur,
      minimumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${cur}`;
  }
}

export default async function InvoiceDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | undefined };
}) {
  const supabase = createRouteSupabase();

  const { id } = params;

  // Fetch the invoice the tenant is allowed to see
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, number, status, issued_at, due_date, total_amount, amount_cents, currency, description"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const invoice = data as InvoiceRow;

  const isPaid = String(invoice.status ?? "").toLowerCase() === "paid";
  const amount = fmtAmount(
    invoice.total_amount,
    invoice.amount_cents,
    invoice.currency
  );

  // Preserve list state if provided
  const backHref =
    searchParams.return && searchParams.return.startsWith("/tenant/invoices")
      ? searchParams.return
      : "/tenant/invoices";

  const title = invoice.number ?? invoice.id.slice(0, 8).toUpperCase();

  const invoiceUrl = `/api/tenant/invoices/${invoice.id}/pdf`;
  const receiptUrl = `/api/tenant/invoices/${invoice.id}/receipt`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4">
        <Link
          href={backHref}
          className="text-sm text-blue-600 hover:underline"
          prefetch={false}
        >
          ← Back to invoices
        </Link>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">
        Invoice {title}
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        {invoice.description ?? "—"} ·{" "}
        <span className={isPaid ? "text-green-700" : "text-amber-700"}>
          {isPaid ? "PAID" : "OPEN"}
        </span>
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <a
          href={invoiceUrl}
          className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Download invoice (PDF)
        </a>
        <a
          href={receiptUrl}
          className={`inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 ${
            isPaid ? "" : "opacity-60 pointer-events-none"
          }`}
          aria-disabled={!isPaid}
          title={isPaid ? "Download receipt" : "Receipt available after payment"}
        >
          Download receipt (PDF)
        </a>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border bg-white">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 p-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-gray-500">Total</dt>
            <dd className="mt-1 font-medium">{amount}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Status</dt>
            <dd className="mt-1">{(invoice.status ?? "—").toUpperCase()}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Issued</dt>
            <dd className="mt-1">{fmtDate(invoice.issued_at)}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Due</dt>
            <dd className="mt-1">{fmtDate(invoice.due_date)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
