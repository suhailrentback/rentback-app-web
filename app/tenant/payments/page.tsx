// app/tenant/payments/page.tsx
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Payment = {
  id: string;
  invoice_id: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  reference: string | null;
  created_at: string;
  confirmed_at: string | null;
};

type Invoice = {
  id: string;
  number: string | null;
  due_date: string | null;
};

function formatMoney(cents: number, currency: string) {
  const amt = (Number(cents || 0) / 100).toFixed(2);
  return `${amt} ${currency}`;
}

export default async function TenantPaymentsPage() {
  const jar = cookies();
  const sb = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { get: (name: string) => jar.get(name)?.value },
  });

  const { data: auth } = await sb.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) redirect("/not-permitted");

  // Ensure user is tenant (soft check; RLS still enforces)
  const { data: me } = await sb.from("profiles").select("role").eq("user_id", uid).maybeSingle();
  if (!me || !["tenant", "landlord", "staff", "admin"].includes(String(me.role))) {
    redirect("/not-permitted");
  }

  const { data: payments, error } = await sb
    .from("payments")
    .select("id, invoice_id, amount_cents, currency, status, reference, created_at, confirmed_at")
    .eq("tenant_id", uid)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
        <h1 className="text-xl font-semibold">My Payments</h1>
        <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          Failed to load payments: {error.message}
        </p>
      </div>
    );
  }

  const invoiceIds = Array.from(
    new Set((payments || []).map((p) => p.invoice_id).filter(Boolean) as string[])
  );
  let invoiceById = new Map<string, Invoice>();
  if (invoiceIds.length) {
    const { data: invoices } = await sb
      .from("invoices")
      .select("id, number, due_date")
      .in("id", invoiceIds);
    (invoices || []).forEach((inv) => invoiceById.set(inv.id, inv));
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Payments</h1>
        <Link href="/tenant" className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
          ← Tenant home
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="border px-2 py-1 text-left">Created</th>
              <th className="border px-2 py-1 text-left">Invoice</th>
              <th className="border px-2 py-1 text-left">Reference</th>
              <th className="border px-2 py-1 text-left">Amount</th>
              <th className="border px-2 py-1 text-left">Status</th>
              <th className="border px-2 py-1 text-left">Confirmed</th>
            </tr>
          </thead>
          <tbody>
            {(payments || []).map((p) => {
              const inv = p.invoice_id ? invoiceById.get(p.invoice_id) : null;
              return (
                <tr key={p.id}>
                  <td className="border px-2 py-1">{new Date(p.created_at).toLocaleString()}</td>
                  <td className="border px-2 py-1">
                    {inv?.number || "—"}{" "}
                    {inv?.id ? (
                      <Link className="text-blue-600 underline" href={`/tenant/invoices/${inv.id}`}>
                        View
                      </Link>
                    ) : null}
                  </td>
                  <td className="border px-2 py-1">{p.reference || "—"}</td>
                  <td className="border px-2 py-1">{formatMoney(p.amount_cents, p.currency)}</td>
                  <td className="border px-2 py-1">{p.status}</td>
                  <td className="border px-2 py-1">
                    {p.confirmed_at ? new Date(p.confirmed_at).toLocaleString() : "—"}
                  </td>
                </tr>
              );
            })}
            {!payments?.length && (
              <tr>
                <td className="border px-2 py-4 text-center" colSpan={6}>
                  No payments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
