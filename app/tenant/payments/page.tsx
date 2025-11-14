// app/tenant/payments/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type RawRow = {
  id: string;
  invoice_id: string | null;
  amount_cents: number | null;
  currency: string | null;
  status: string | null;
  reference: string | null;
  created_at: string | null;
  confirmed_at: string | null;
  // Supabase may return joined record as object or array depending on relationship
  invoice?: any;
};

type Row = {
  id: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
  amountCents: number;
  currency: string;
  status: string;
  reference: string | null;
  createdAt: string | null;
  confirmedAt: string | null;
};

function fmtAmt(cents?: number | null, ccy?: string | null) {
  const v = ((Number(cents || 0)) / 100).toFixed(2);
  return `${v} ${ccy || ""}`.trim();
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase();
  const styles =
    s === "confirmed" || s === "paid"
      ? "bg-green-100 text-green-700"
      : s === "pending" || s === "open"
      ? "bg-yellow-100 text-yellow-800"
      : s === "failed" || s === "overdue"
      ? "bg-red-100 text-red-700"
      : "bg-gray-100 text-gray-700";
  const label =
    s === "confirmed"
      ? "Confirmed"
      : s === "paid"
      ? "Paid"
      : s === "pending"
      ? "Pending"
      : s === "open"
      ? "Open"
      : s === "failed"
      ? "Failed"
      : s === "overdue"
      ? "Overdue"
      : status || "—";
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}>{label}</span>;
}

async function loadRows() {
  const jar = cookies();
  const sb = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { get: (name: string) => jar.get(name)?.value },
  });

  const { data: auth } = await sb.auth.getUser();
  if (!auth?.user?.id) return [];

  const { data, error } = await sb
    .from("payments")
    .select(
      [
        "id",
        "invoice_id",
        "amount_cents",
        "currency",
        "status",
        "reference",
        "created_at",
        "confirmed_at",
        "invoice:invoices(id,number,due_date)",
      ].join(",")
    )
    .eq("tenant_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return [];

  const rows: Row[] = (data as RawRow[]).map((r) => {
    const inv = Array.isArray(r.invoice) ? r.invoice[0] : r.invoice;
    return {
      id: r.id,
      invoiceId: inv?.id ?? r.invoice_id ?? null,
      invoiceNumber: inv?.number ?? null,
      amountCents: Number(r.amount_cents || 0),
      currency: r.currency || "PKR",
      status: r.status || "pending",
      reference: r.reference || null,
      createdAt: r.created_at || null,
      confirmedAt: r.confirmed_at || null,
    };
  });

  return rows;
}

export default async function TenantPaymentsPage() {
  const rows = await loadRows();

  return (
    <div className="mx-auto w-full max-w-4xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Payments</h1>
        <Link href="/tenant/invoices" className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
          ← My Invoices
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Invoice</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Reference</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                  No payments yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-3 py-2">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</td>
                <td className="px-3 py-2">
                  {r.invoiceNumber ? (
                    <Link className="underline" href={`/tenant/invoices/${r.invoiceId}`}>
                      {r.invoiceNumber}
                    </Link>
                  ) : (
                    r.invoiceId || "—"
                  )}
                </td>
                <td className="px-3 py-2">{fmtAmt(r.amountCents, r.currency)}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-3 py-2">{r.reference || "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    {r.invoiceId ? (
                      <Link href={`/tenant/invoices/${r.invoiceId}`} className="rounded border px-2 py-1">
                        View invoice
                      </Link>
                    ) : null}
                    {/* Receipt link only when confirmed */}
                    {r.status.toLowerCase() === "confirmed" && r.invoiceId ? (
                      <a
                        href={`/api/tenant/invoices/${r.invoiceId}/receipt`}
                        className="rounded border px-2 py-1"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download receipt (PDF)
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">Receipt after confirmation</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
