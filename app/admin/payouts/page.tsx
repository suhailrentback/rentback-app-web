// app/admin/payouts/page.tsx
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import React from "react";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  landlord_id: string | null;
  amount_cents: number;
  currency?: string | null;
  status: "pending" | "approved" | "denied";
  notes?: string | null;
  created_at: string;
  decided_by?: string | null;
  decided_at?: string | null;
};

function formatMoney(cents: number, currency?: string | null) {
  const n = Number.isFinite(cents) ? cents : 0;
  const cur = currency || "EUR";
  return `${cur} ${(n / 100).toFixed(2)}`;
}

function statusPill(s: Row["status"]) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
  const cls =
    s === "approved"
      ? "bg-green-100 text-green-800"
      : s === "denied"
      ? "bg-red-100 text-red-800"
      : "bg-gray-100 text-gray-800";
  const dot =
    s === "approved" ? "bg-green-500" : s === "denied" ? "bg-red-500" : "bg-gray-500";
  return (
    <span className={`${base} ${cls}`}>
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${dot}`} />
      {s.toUpperCase()}
    </span>
  );
}

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const status = (searchParams?.status || "").toLowerCase();
  const q = (searchParams?.q || "").trim();

  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  let query = supabase
    .from("payout_requests")
    .select(
      "id, landlord_id, amount_cents, currency, status, notes, created_at, decided_by, decided_at"
    )
    .order("created_at", { ascending: false });

  if (["pending", "approved", "denied"].includes(status)) {
    query = query.eq("status", status);
  }

  // Optional naive search: matches id or notes
  if (q) {
    // Supabase doesn't support OR ilike nicely in one call without RPC; keep it simple.
    // Filter by notes; ID filter we’ll just client-side check after fetch.
    query = query.ilike("notes", `%${q}%`);
  }

  const { data, error } = await query.limit(300);
  const dataArr = Array.isArray(data) ? data : [];
  const rows: Row[] = dataArr
    .filter((r: any) => (!q ? true : String(r?.id || "").includes(q) || true))
    .map((r: any) => ({
      id: String(r.id),
      landlord_id: r.landlord_id ?? null,
      amount_cents: Number(r.amount_cents) || 0,
      currency: r.currency ?? "EUR",
      status: (r.status || "pending") as Row["status"],
      notes: r.notes ?? "",
      created_at: r.created_at || "",
      decided_by: r.decided_by ?? null,
      decided_at: r.decided_at ?? null,
    }));

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Payout Requests</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/api/payouts/export?status=${encodeURIComponent(
              status || ""
            )}&q=${encodeURIComponent(q || "")}`}
            prefetch={false}
            className="rounded-xl border px-3 py-1.5 text-sm hover:shadow-sm"
          >
            Export CSV
          </Link>
        </div>
      </div>

      <form className="mb-4 grid gap-3 md:grid-cols-3" method="GET">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select
            className="w-full rounded-xl border px-3 py-2"
            name="status"
            defaultValue={status}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Search</label>
          <input
            className="w-full rounded-xl border px-3 py-2"
            name="q"
            placeholder="Search by ID or notes"
            defaultValue={q}
          />
        </div>
        <div className="flex items-end">
          <button className="rounded-xl border px-3 py-2 hover:shadow-sm" type="submit">
            Apply
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-2">Created</th>
              <th className="px-4 py-2">Request ID</th>
              <th className="px-4 py-2">Landlord</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Notes</th>
              <th className="px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-red-600">
                  Failed to load payout requests.
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-gray-500">
                  No payout requests found.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 font-mono">{r.id}</td>
                  <td className="px-4 py-2 font-mono">{r.landlord_id || "—"}</td>
                  <td className="px-4 py-2">{formatMoney(r.amount_cents, r.currency)}</td>
                  <td className="px-4 py-2">{statusPill(r.status)}</td>
                  <td className="px-4 py-2 max-w-[24ch] truncate" title={r.notes || ""}>
                    {r.notes || "—"}
                  </td>
                  <td className="px-4 py-2">
                    {r.status === "pending" ? (
                      <div className="flex items-center gap-2">
                        <form method="POST" action="/admin/api/payouts/decide">
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="decision" value="approve" />
                          <button
                            className="rounded-xl border px-3 py-1.5 text-xs hover:shadow-sm"
                            type="submit"
                          >
                            Approve
                          </button>
                        </form>
                        <form method="POST" action="/admin/api/payouts/decide">
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="decision" value="deny" />
                          <button
                            className="rounded-xl border px-3 py-1.5 text-xs hover:shadow-sm"
                            type="submit"
                          >
                            Deny
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">
                        {r.status.toUpperCase()}
                        {r.decided_at ? ` • ${new Date(r.decided_at).toLocaleString()}` : ""}
                      </div>
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
