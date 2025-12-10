// app/admin/payouts/page.tsx
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";

function sbFromCookies() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });
}

function fmtMoney(cents: number, currency = "PKR") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format((cents || 0) / 100);
  } catch {
    return `${(cents || 0) / 100} ${currency}`;
  }
}

type SearchParams = { [k: string]: string | string[] | undefined };

export default async function AdminPayoutsPage({ searchParams }: { searchParams?: SearchParams }) {
  const sb = sbFromCookies();

  // guard: must be staff/admin
  const [{ data: userRes }, { data: profRes, error: profErr }] = await Promise.all([
    sb.auth.getUser(),
    sb.from("profiles").select("id, role, email, full_name").limit(1),
  ]);
  const role = profRes?.[0]?.role || null;
  if (!userRes?.user || !role || (role !== "staff" && role !== "admin")) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-semibold mb-2">Admin · Payouts</h1>
        <p className="text-sm text-red-600">Not permitted.</p>
      </div>
    );
  }

  const sp = searchParams || {};
  const status = (typeof sp.status === "string" ? sp.status : "") || "";
  const currency = (typeof sp.currency === "string" ? sp.currency : "") || "";
  const q = (typeof sp.q === "string" ? sp.q : "") || "";
  const ok = (typeof sp.ok === "string" ? sp.ok : "") || "";
  const err = (typeof sp.err === "string" ? sp.err : "") || "";

  // query
  let query = sb
    .from("landlord_payouts")
    .select("id, landlord_id, amount_cents, currency, status, requested_at, requested_by, decided_at, decided_by, notes")
    .order("requested_at", { ascending: false })
    .limit(200);

  if (status && ["pending", "approved", "denied"].includes(status)) query = query.eq("status", status);
  if (currency) query = query.eq("currency", currency);
  if (q) {
    // simple filter on notes or landlord_id
    query = query.or(`notes.ilike.%${q}%,landlord_id.eq.${q}`);
  }

  const { data: rows, error } = await query;
  const data = (rows as any[]) || [];

  const makeHref = (next: Partial<{ status: string; currency: string; q: string }>) => {
    const params = new URLSearchParams();
    if (next.status !== undefined ? next.status : status) params.set("status", next.status ?? status);
    if (next.currency !== undefined ? next.currency : currency) params.set("currency", next.currency ?? currency);
    if (next.q !== undefined ? next.q : q) params.set("q", next.q ?? q);
    return `/admin/payouts?${params.toString()}`;
  };

  const exportHref = (() => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (currency) p.set("currency", currency);
    if (q) p.set("q", q);
    return `/admin/api/payouts/export?${p.toString()}`;
  })();

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Admin · Payouts</h1>
          <p className="text-sm text-zinc-600">Review payout requests, approve/deny, export CSV.</p>
        </div>
        <div className="flex items-center gap-2">
          <a href={exportHref} className="rounded-2xl border px-3 py-2 text-sm hover:bg-zinc-50">
            Export CSV
          </a>
        </div>
      </div>

      {(ok || err) && (
        <div
          className={
            "mb-4 rounded-xl border px-3 py-2 text-sm " +
            (ok ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-rose-300 bg-rose-50 text-rose-800")
          }
        >
          {ok ? "Action completed." : `Error: ${err}`}
        </div>
      )}

      <form method="get" action="/admin/payouts" className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Status</label>
          <select name="status" defaultValue={status} className="w-full rounded-xl border px-3 py-2 text-sm">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Currency</label>
          <select name="currency" defaultValue={currency} className="w-full rounded-xl border px-3 py-2 text-sm">
            <option value="">All</option>
            <option value="PKR">PKR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Search</label>
          <input
            name="q"
            defaultValue={q}
            className="w-full rounded-xl border px-3 py-2 text-sm"
            placeholder="notes or landlord_id"
          />
        </div>
        <div className="flex items-end">
          <button className="w-full rounded-2xl bg-black px-3 py-2 text-sm text-white hover:opacity-90">Apply</button>
        </div>
      </form>

      <div className="rounded-2xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-zinc-500">
            <tr>
              <th className="py-2 px-3">Requested</th>
              <th className="py-2 px-3">Landlord</th>
              <th className="py-2 px-3">Amount</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Decided</th>
              <th className="py-2 px-3">Notes</th>
              <th className="py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
                <td colSpan={7} className="py-3 px-3 text-rose-700">
                  {error.message}
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-3 px-3 text-zinc-500">
                  No payout requests.
                </td>
              </tr>
            ) : (
              data.map((r: any) => {
                const pill =
                  r.status === "pending"
                    ? "bg-amber-100 text-amber-700"
                    : r.status === "approved"
                    ? "bg-emerald-100 text-emerald-700"
                    : r.status === "denied"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-zinc-100 text-zinc-700";
                return (
                  <tr key={r.id} className="border-t">
                    <td className="py-2 px-3">{new Date(r.requested_at).toLocaleString()}</td>
                    <td className="py-2 px-3">
                      <code className="text-xs">{String(r.landlord_id).slice(0, 8)}…</code>
                    </td>
                    <td className="py-2 px-3">{fmtMoney(Number(r.amount_cents || 0), r.currency || "PKR")}</td>
                    <td className="py-2 px-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${pill}`}>{r.status}</span>
                    </td>
                    <td className="py-2 px-3">{r.decided_at ? new Date(r.decided_at).toLocaleString() : "—"}</td>
                    <td className="py-2 px-3">{r.notes || "—"}</td>
                    <td className="py-2 px-3">
                      {r.status === "pending" ? (
                        <div className="flex items-center gap-2">
                          <form method="post" action="/admin/api/payouts/decide">
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="decision" value="approve" />
                            <button className="rounded-xl bg-emerald-600 px-3 py-1 text-white hover:opacity-90">
                              Approve
                            </button>
                          </form>
                          <form method="post" action="/admin/api/payouts/decide">
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="decision" value="deny" />
                            <button className="rounded-xl bg-rose-600 px-3 py-1 text-white hover:opacity-90">
                              Deny
                            </button>
                          </form>
                        </div>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <Link href="/admin" className="rounded-2xl border px-3 py-2 hover:bg-zinc-50 text-sm">
          Back to Admin
        </Link>
      </div>
    </div>
  );
}
