// app/tenant/payments/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type InvoiceMini = {
  id: string;
  number: string | null;
  due_date: string | null;
};

type Row = {
  id: string;
  amount_cents: number | null;
  currency: string | null;
  status: string | null;
  reference: string | null;
  created_at: string | null;
  confirmed_at: string | null;
  // May come back as object or array depending on FK introspection; we normalize below.
  invoice: InvoiceMini | InvoiceMini[] | null;
};

async function getRows() {
  const cookieStore = cookies();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { get: (n: string) => cookieStore.get(n)?.value },
  });

  const { data: me } = await supabase.auth.getUser();
  if (!me?.user) return [];

  const { data, error } = await supabase
    .from("payments")
    .select(
      "id, amount_cents, currency, status, reference, created_at, confirmed_at, invoice:invoices(id, number, due_date)"
    )
    .eq("tenant_id", me.user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) return [];

  // Normalize invoice shape (object vs array) to object-or-null
  const normalized: {
    id: string;
    amount_cents: number;
    currency: string;
    status: string;
    reference: string;
    created_at: string;
    confirmed_at: string | null;
    invoice: { id: string; number: string | null; due_date: string | null } | null;
  }[] = data.map((p: Row) => {
    const inv = Array.isArray(p.invoice) ? p.invoice[0] : p.invoice;
    return {
      id: String(p.id),
      amount_cents: Math.max(0, Number(p.amount_cents ?? 0)),
      currency: String(p.currency ?? "PKR"),
      status: String(p.status ?? ""),
      reference: String(p.reference ?? ""),
      created_at: p.created_at ?? "",
      confirmed_at: p.confirmed_at ?? null,
      invoice: inv
        ? { id: String(inv.id), number: inv.number ?? null, due_date: inv.due_date ?? null }
        : null,
    };
  });

  return normalized;
}

export default async function TenantPaymentsPage() {
  const rows = await getRows();

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <div className="mb-4">
        <Link href="/tenant/invoices" className="text-sm underline hover:no-underline">
          ← Back to invoices
        </Link>
      </div>

      <h1 className="mb-2 text-xl font-semibold">My payments</h1>
      <p className="mb-4 text-sm text-gray-600">
        Submitted and confirmed payments. Confirmed payments include a receipt PDF.
      </p>

      {rows.length === 0 ? (
        <div className="rounded-2xl border p-6 text-sm text-gray-600">
          No payments yet. Use <span className="font-medium">Pay now</span> from an open invoice.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Date</th>
                <th className="px-4 py-2 text-left font-medium">Invoice</th>
                <th className="px-4 py-2 text-left font-medium">Reference</th>
                <th className="px-4 py-2 text-left font-medium">Amount</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const amount = (r.amount_cents ?? 0) / 100;
                const isConfirmed = String(r.status).toLowerCase() === "confirmed";
                const invoiceNumber =
                  r.invoice?.number ?? (r.invoice ? r.invoice.id.slice(0, 8) : "—");
                const invoiceId = r.invoice?.id;
                return (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-2">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-2">
                      {invoiceId ? (
                        <Link
                          href={`/tenant/invoices/${invoiceId}`}
                          className="underline hover:no-underline"
                        >
                          {invoiceNumber}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2">{r.reference || "—"}</td>
                    <td className="px-4 py-2">
                      {amount} {r.currency}
                    </td>
                    <td className="px-4 py-2">
                      <span className="rounded-full border px-2 py-0.5 text-xs">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-2">
                        {invoiceId && (
                          <a
                            href={`/api/tenant/invoices/${invoiceId}/pdf`}
                            className="rounded-xl border px-2 py-1 text-xs hover:bg-gray-50"
                          >
                            Invoice PDF
                          </a>
                        )}
                        {isConfirmed && invoiceId && (
                          <a
                            href={`/api/tenant/invoices/${invoiceId}/receipt`}
                            className="rounded-xl border px-2 py-1 text-xs hover:bg-gray-50"
                          >
                            Receipt PDF
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
