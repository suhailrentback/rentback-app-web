// app/admin/payments/page.tsx
// Server Component: Admin Payments list with per-row Confirm button.
// No client hooks, no server actions exported (uses API route).

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type SearchParams = Record<string, string | string[] | undefined>;

type Row = {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  reference: string;
  created_at: string;
  confirmed_at: string | null;
  invoice: { id: string; number: string; due_date: string } | null;
};

function getSb() {
  const jar = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { get: (name: string) => jar.get(name)?.value },
  });
}

async function requireStaffOrAdmin() {
  const sb = getSb();
  const { data: auth } = await sb.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return { ok: false as const, status: 401 as const };

  const { data: me } = await sb.from("profiles").select("role").eq("user_id", uid).maybeSingle();
  if (!me || !["staff", "admin"].includes(String(me.role))) {
    return { ok: false as const, status: 403 as const };
  }
  return { ok: true as const, sb };
}

function fmtAmount(cents: number, currency: string) {
  const amount = (Number(cents || 0) / 100).toFixed(2);
  return `${amount} ${currency}`;
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? String(iso) : d.toISOString().slice(0, 10);
}

function normalizeRows(data: any[]): Row[] {
  return (Array.isArray(data) ? data : []).map((r: any) => {
    const invRaw = Array.isArray(r.invoice) ? r.invoice[0] : r.invoice;
    const invoice =
      invRaw && invRaw.id
        ? {
            id: String(invRaw.id),
            number: String(invRaw.number ?? ""),
            due_date: String(invRaw.due_date ?? ""),
          }
        : null;
    return {
      id: String(r.id),
      amount_cents: Number(r.amount_cents ?? 0),
      currency: String(r.currency ?? ""),
      status: String(r.status ?? ""),
      reference: String(r.reference ?? ""),
      created_at: String(r.created_at ?? ""),
      confirmed_at: r.confirmed_at ? String(r.confirmed_at) : null,
      invoice,
    };
  });
}

async function fetchRows(sb: ReturnType<typeof getSb>, params: SearchParams) {
  const status = (params.status as string) || "";
  const currency = (params.currency as string) || "";
  const q = (params.q as string) || "";
  const from = (params.from as string) || "";
  const to = (params.to as string) || "";

  let query = sb
    .from("payments")
    .select(
      "id, amount_cents, currency, status, reference, created_at, confirmed_at, invoice:invoices(id, number, due_date)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (status) query = query.eq("status", status);
  if (currency) query = query.eq("currency", currency);
  if (q) query = query.ilike("reference", `%${q}%`);
  if (from) query = query.gte("created_at", `${from}T00:00:00Z`);
  if (to) query = query.lte("created_at", `${to}T23:59:59Z`);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return normalizeRows(data || []);
}

function buildExportHref(params: SearchParams) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (typeof v === "string" && v) qs.set(k, v);
  }
  const qstr = qs.toString();
  return qstr ? `/admin/api/payments/export?${qstr}` : `/admin/api/payments/export`;
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const guard = await requireStaffOrAdmin();
  if (!guard.ok) {
    const msg = guard.status === 401 ? "Unauthorized" : "Forbidden";
    return (
      <div className="mx-auto w-full max-w-5xl p-6">
        <h1 className="text-xl font-semibold">Admin · Payments</h1>
        <p className="mt-2 text-sm text-red-600">{msg}</p>
      </div>
    );
  }
  const { sb } = guard;

  // Load rows
  const rows = await fetchRows(sb, searchParams || {});
  const exportHref = buildExportHref(searchParams || {});

  return (
    <div className="mx-auto w-full max-w-5xl p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Admin · Payments</h1>
        <a
          href={exportHref}
          className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Export CSV
        </a>
      </div>

      {/* Simple filters (non-interactive placeholders for now; they won’t break) */}
      <form method="GET" className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-5">
        <input
          name="q"
          placeholder="Search reference…"
          defaultValue={(searchParams?.q as string) || ""}
          className="rounded-xl border px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={(searchParams?.status as string) || ""}
          className="rounded-xl border px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="pending">pending</option>
          <option value="confirmed">confirmed</option>
          <option value="failed">failed</option>
        </select>
        <input
          type="date"
          name="from"
          defaultValue={(searchParams?.from as string) || ""}
          className="rounded-xl border px-3 py-2 text-sm"
        />
        <input
          type="date"
          name="to"
          defaultValue={(searchParams?.to as string) || ""}
          className="rounded-xl border px-3 py-2 text-sm"
        />
        <button className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">
          Apply
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2">Payment</th>
              <th className="px-3 py-2">Invoice</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Confirmed</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                  No payments found.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">
                    <div className="font-medium">{r.reference || r.id.slice(0, 8)}</div>
                    <div className="text-xs text-gray-500">{r.id}</div>
                  </td>
                  <td className="px-3 py-2">
                    {r.invoice ? (
                      <>
                        <div className="font-medium">{r.invoice.number}</div>
                        <div className="text-xs text-gray-500">
                          Due {fmtDate(r.invoice.due_date)}
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{fmtAmount(r.amount_cents, r.currency)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        "rounded-lg px-2 py-0.5 text-xs " +
                        (r.status === "confirmed"
                          ? "bg-green-50 text-green-700"
                          : r.status === "failed"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-amber-50 text-amber-700")
                      }
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">{fmtDate(r.created_at)}</td>
                  <td className="px-3 py-2">{fmtDate(r.confirmed_at)}</td>
                  <td className="px-3 py-2">
                    {r.status === "confirmed" ? (
                      <button
                        disabled
                        className="rounded-xl border px-3 py-1.5 text-sm opacity-60"
                        title="Already confirmed"
                      >
                        Confirmed
                      </button>
                    ) : (
                      <form
                        method="POST"
                        action="/admin/api/payments/confirm"
                        className="inline"
                      >
                        <input type="hidden" name="paymentId" value={r.id} />
                        <button className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50">
                          Confirm
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
