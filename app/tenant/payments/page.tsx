// app/tenant/payments/page.tsx
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Row = {
  id: string;
  invoice_id: string | null;
  amount_cents: number | null;
  currency: string | null;
  status: string | null; // PENDING | CONFIRMED
  reference: string | null;
  created_at: string | null;
  confirmed_at: string | null;
  invoice?: { id: string; number: string | number; due_date: string | null } | null;
};

function fmtMoney(cents: number | null | undefined, curr: string | null | undefined) {
  const v = (cents ?? 0) / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: (curr || "PKR").toUpperCase(),
      maximumFractionDigits: 2,
    }).format(v);
  } catch {
    return `${v.toFixed(2)} ${curr || ""}`.trim();
  }
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "2-digit" }).format(
      new Date(iso)
    );
  } catch {
    return iso.slice(0, 10);
  }
}

function Pill({ tone, children }: { tone: "blue" | "green" | "gray"; children: React.ReactNode }) {
  const map = {
    blue: "border-blue-300 text-blue-800 bg-blue-50",
    green: "border-green-300 text-green-800 bg-green-50",
    gray: "border-gray-300 text-gray-700 bg-gray-50",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${map[tone]}`}>
      {children}
    </span>
  );
}

export default async function TenantPaymentsPage() {
  const jar = cookies();
  const sb = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      get: (n: string) => jar.get(n)?.value,
      set() {},
      remove() {},
    },
  });

  const { data: auth } = await sb.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) {
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <h1 className="text-xl font-semibold">My Payments</h1>
        <p className="mt-4 text-sm text-red-600">Not signed in.</p>
      </div>
    );
  }

  // Pull latest 200, newest first
  const { data, error } = await sb
    .from("payments")
    .select(
      `
      id, invoice_id, amount_cents, currency, status, reference, created_at, confirmed_at,
      invoice:invoices ( id, number, due_date )
    `
    )
    .eq("tenant_id", uid)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <h1 className="text-xl font-semibold">My Payments</h1>
        <p className="mt-4 text-sm text-red-600">Failed to load: {error.message}</p>
      </div>
    );
  }

  const rows: Row[] = ((data as any[]) || []).map((r: any) => {
    const inv = Array.isArray(r.invoice) ? r.invoice[0] : r.invoice;
    return {
      id: r.id,
      invoice_id: r.invoice_id ?? inv?.id ?? null,
      amount_cents: r.amount_cents ?? null,
      currency: r.currency ?? null,
      status: r.status ?? "PENDING",
      reference: r.reference ?? null,
      created_at: r.created_at ?? null,
      confirmed_at: r.confirmed_at ?? null,
      invoice: inv
        ? { id: String(inv.id), number: inv.number, due_date: inv.due_date ?? null }
        : null,
    };
  });

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Payments</h1>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">No payments yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const paid = (r.status || "").toUpperCase() === "CONFIRMED";
                return (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3">{fmtDate(r.created_at)}</td>
                    <td className="px-4 py-3">
                      {r.invoice ? (
                        <Link
                          href={`/tenant/invoices/${r.invoice.id}`}
                          className="font-medium hover:underline"
                        >
                          {String(r.invoice.number)}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">{fmtMoney(r.amount_cents, r.currency)}</td>
                    <td className="px-4 py-3">{paid ? <Pill tone="green">CONFIRMED</Pill> : <Pill tone="blue">PENDING</Pill>}</td>
                    <td className="px-4 py-3">{r.reference || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {r.invoice_id ? (
                          <Link
                            href={`/api/tenant/invoices/${r.invoice_id}/pdf`}
                            className="rounded-xl border px-3 py-1.5 hover:bg-gray-50"
                          >
                            Invoice PDF
                          </Link>
                        ) : null}
                        {/* Receipt PDF (available after confirm). Route exists and will 404 if none yet. */}
                        {r.invoice_id && paid ? (
                          <Link
                            href={`/api/tenant/invoices/${r.invoice_id}/receipt`}
                            className="rounded-xl border px-3 py-1.5 hover:bg-gray-50"
                          >
                            Receipt PDF
                          </Link>
                        ) : (
                          <span className="rounded-xl border px-3 py-1.5 text-gray-300">Receipt</span>
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
