// app/admin/payments/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Raw = {
  id: string;
  invoice_id: string | null;
  amount_cents: number | null;
  currency: string | null;
  status: string | null;
  reference: string | null;
  created_at: string | null;
  confirmed_at: string | null;
  invoice?: any;
  tenant?: any;
};

type Row = {
  id: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
  tenantEmail: string | null;
  amountCents: number;
  currency: string;
  status: string;
  reference: string | null;
  createdAt: string | null;
  confirmedAt: string | null;
};

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

async function guardStaff() {
  const jar = cookies();
  const sb = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { get: (name: string) => jar.get(name)?.value },
  });
  const { data: auth } = await sb.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return { ok: false as const };
  // Minimal check: presence in profiles with staff/admin role
  const { data: p } = await sb.from("profiles").select("role").eq("user_id", uid).maybeSingle();
  if (!p || !["staff", "admin"].includes((p as any).role)) return { ok: false as const };
  return { ok: true as const, sb };
}

async function loadRows(sb: ReturnType<typeof createServerClient>) {
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
        "invoice:invoices(id,number)",
        "tenant:profiles!inner(email)",
      ].join(",")
    )
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) return [];
  return (data as Raw[]).map((r) => {
    const inv = Array.isArray(r.invoice) ? r.invoice[0] : r.invoice;
    const t = Array.isArray(r.tenant) ? r.tenant[0] : r.tenant;
    return {
      id: r.id,
      invoiceId: inv?.id ?? r.invoice_id ?? null,
      invoiceNumber: inv?.number ?? null,
      tenantEmail: t?.email ?? null,
      amountCents: Number(r.amount_cents || 0),
      currency: r.currency || "PKR",
      status: r.status || "pending",
      reference: r.reference || null,
      createdAt: r.created_at || null,
      confirmedAt: r.confirmed_at || null,
    } as Row;
  });
}

export default async function AdminPaymentsPage() {
  const g = await guardStaff();
  if (!g.ok) {
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <h1 className="text-xl font-semibold">Payments (Admin)</h1>
        <p className="mt-2 text-sm text-red-600">Not permitted.</p>
      </div>
    );
  }
  const rows = await loadRows(g.sb as any);

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Payments (Admin)</h1>
        <div className="flex items-center gap-2">
          <a
            className="rounded border px-3 py-1.5 text-sm"
            href="/admin/api/payments/export"
            target="_blank"
            rel="noopener noreferrer"
          >
            Export CSV
          </a>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Invoice</th>
              <th className="px-3 py-2">Tenant</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Reference</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                  No payments yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-3 py-2">{r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}</td>
                <td className="px-3 py-2">
                  {r.invoiceNumber ? (
                    <Link className="underline" href={`/tenant/invoices/${r.invoiceId}`}>
                      {r.invoiceNumber}
                    </Link>
                  ) : (
                    r.invoiceId || "—"
                  )}
                </td>
                <td className="px-3 py-2">{r.tenantEmail || "—"}</td>
                <td className="px-3 py-2">{fmtAmt(r.amountCents, r.currency)}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-3 py-2">{r.reference || "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    {r.invoiceId ? (
                      <a
                        className="rounded border px-2 py-1"
                        href={`/api/tenant/invoices/${r.invoiceId}/receipt`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Receipt PDF
                      </a>
                    ) : null}
                    {r.status.toLowerCase() !== "confirmed" && (
                      <form action="/admin/api/payments/confirm" method="post" className="inline">
                        <input type="hidden" name="paymentId" value={r.id} />
                        <button className="rounded border px-2 py-1 hover:bg-gray-50" title="Confirm payment">
                          Confirm
                        </button>
                      </form>
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

function fmtAmt(cents?: number | null, ccy?: string | null) {
  const v = ((Number(cents || 0)) / 100).toFixed(2);
  return `${v} ${ccy || ""}`.trim();
}
