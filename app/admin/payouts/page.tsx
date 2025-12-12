// app/admin/payouts/page.tsx
import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Row = {
  id: string;
  landlord_id: string | null;
  amount_cents: number;
  currency: string | null;
  status: "REQUESTED" | "APPROVED" | "DENIED" | string;
  requested_at: string;
  decided_at: string | null;
  decided_by: string | null;
  note: string | null;
};

export const metadata = { title: "Admin · Payouts — RentBack" };

async function getRows(status?: string) {
  const sb = await createClient(cookies());
  let q = sb
    .from("payout_requests")
    .select(
      "id, landlord_id, amount_cents, currency, status, requested_at, decided_at, decided_by, note"
    )
    .order("requested_at", { ascending: false })
    .limit(200);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  return error ? [] : ((data as any) ?? []);
}

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams: { status?: string; ok?: string; err?: string };
}) {
  const status = searchParams?.status;
  const ok = searchParams?.ok || "";
  const err = searchParams?.err || "";
  const rows: Row[] = await getRows(status);

  const totalCents = rows.reduce((s, r) => s + (r.amount_cents || 0), 0);
  const total = (totalCents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: rows[0]?.currency || "EUR",
  });

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Payout Requests</h1>
        <div className="flex items-center gap-2">
          <form method="get" action="/admin/api/payouts/export">
            {status ? <input type="hidden" name="status" value={status} /> : null}
            <button className="rounded-lg border px-3 py-1.5 text-sm">Export CSV</button>
          </form>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/admin/payouts"
          className={`rounded border px-2 py-1 ${!status ? "bg-black/5 dark:bg-white/10" : ""}`}
        >
          All
        </Link>
        <Link
          href="/admin/payouts?status=REQUESTED"
          className={`rounded border px-2 py-1 ${status === "REQUESTED" ? "bg-black/5 dark:bg-white/10" : ""}`}
        >
          Requested
        </Link>
        <Link
          href="/admin/payouts?status=APPROVED"
          className={`rounded border px-2 py-1 ${status === "APPROVED" ? "bg-black/5 dark:bg-white/10" : ""}`}
        >
          Approved
        </Link>
        <Link
          href="/admin/payouts?status=DENIED"
          className={`rounded border px-2 py-1 ${status === "DENIED" ? "bg-black/5 dark:bg-white/10" : ""}`}
        >
          Denied
        </Link>
      </div>

      {ok && <div className="rounded-lg border p-3 bg-green-50 dark:bg-green-900/20 text-sm">{ok}</div>}
      {err && <div className="rounded-lg border p-3 bg-red-50 dark:bg-red-900/20 text-sm">{err}</div>}

      <section className="rounded-xl border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-black/5 dark:bg-white/5">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Landlord</th>
              <th className="text-left p-3">Amount</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Requested</th>
              <th className="text-left p-3">Decided</th>
              <th className="text-right p-3">Decide</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 opacity-60">
                  No payout requests.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t align-top">
                <td className="p-3 font-mono text-xs">{r.id}</td>
                <td className="p-3 font-mono text-xs">{r.landlord_id || "—"}</td>
                <td className="p-3">
                  {(r.amount_cents / 100).toLocaleString(undefined, {
                    style: "currency",
                    currency: r.currency || "EUR",
                  })}
                </td>
                <td className="p-3">
                  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                    {r.status}
                  </span>
                </td>
                <td className="p-3">
                  {new Date(r.requested_at).toLocaleString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="p-3">
                  {r.decided_at
                    ? new Date(r.decided_at).toLocaleString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </td>
                <td className="p-3 text-right">
                  {r.status === "REQUESTED" ? (
                    <div className="flex flex-col gap-2 items-end">
                      <form method="post" action="/admin/api/payouts/decide" className="flex gap-2">
                        <input type="hidden" name="id" value={r.id} />
                        <input
                          name="note"
                          placeholder="Note (optional)"
                          className="border rounded px-2 py-1 text-xs w-48"
                        />
                        <button
                          name="action"
                          value="approve"
                          className="border rounded px-2 py-1 text-xs"
                        >
                          Approve
                        </button>
                        <button name="action" value="deny" className="border rounded px-2 py-1 text-xs">
                          Deny
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="text-xs opacity-60">—</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t bg-black/5 dark:bg-white/5">
                <td className="p-3 font-medium" colSpan={2}>
                  Total
                </td>
                <td className="p-3 font-medium">{total}</td>
                <td colSpan={4}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </section>
    </div>
  );
}
