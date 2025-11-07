// app/landlord/invoices/page.tsx
import Link from "next/link";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Search = {
  q?: string;
  status?: string;
  page?: string;
  limit?: string;
  ok?: string;
  err?: string;
};

type Row = {
  id: string;
  number: string | null;
  description: string | null;
  status: string | null;
  total_amount: number | null;
  currency: string | null;
  issued_at: string | null;
  due_date: string | null;
};

const ALLOWED_STATUS = ["draft", "open", "issued", "paid", "overdue"] as const;

function pickStatus(s?: string): string | undefined {
  if (!s) return;
  const v = s.toLowerCase();
  return (ALLOWED_STATUS as readonly string[]).includes(v) ? v : undefined;
}

export default async function LandlordInvoicesPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const supabase = createRouteSupabase();

  const q = (Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q) || "";
  const status = pickStatus(
    Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status
  );
  const page = Number(
    (Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page) || "1"
  );
  const limit = Number(
    (Array.isArray(searchParams.limit) ? searchParams.limit[0] : searchParams.limit) ||
      "10"
  );
  const pageSize = Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 10;
  const pageNum = Number.isFinite(page) && page > 0 ? page : 1;
  const from = (pageNum - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("invoices")
    .select(
      "id, number, description, status, total_amount, currency, issued_at, due_date",
      { count: "exact" }
    )
    .order("issued_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }
  if (q) {
    // simple text search over number/description (ilike safe)
    query = query.or(`number.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data, error, count } = await query.range(from, to);

  const rows: Row[] = Array.isArray(data) ? (data as Row[]) : [];

  const ok = (Array.isArray(searchParams.ok) ? searchParams.ok[0] : searchParams.ok) || "";
  const err =
    (Array.isArray(searchParams.err) ? searchParams.err[0] : searchParams.err) || "";

  // build Export CSV URL preserving filters
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  const exportHref = `/api/landlord/invoices/export${params.toString() ? `?${params.toString()}` : ""}`;

  // compute pager URLs
  const total = typeof count === "number" ? count : rows.length;
  const hasPrev = pageNum > 1;
  const hasNext = to + 1 < total;

  const buildPageHref = (n: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status) sp.set("status", status);
    sp.set("page", String(n));
    sp.set("limit", String(pageSize));
    return `/landlord/invoices?${sp.toString()}`;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <div className="flex items-center gap-2">
          <Link
            href={exportHref}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Export CSV
          </Link>
          <Link
            href="/landlord/invoices/new"
            className="rounded-xl border bg-black px-3 py-2 text-sm text-white hover:opacity-90"
          >
            Create invoice
          </Link>
        </div>
      </div>

      <form className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search number or description…"
          className="w-full rounded-xl border px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="w-full rounded-xl border px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {ALLOWED_STATUS.map((s) => (
            <option key={s} value={s}>
              {s.toUpperCase()}
            </option>
          ))}
        </select>
        <input
          type="number"
          name="limit"
          min={1}
          max={100}
          defaultValue={pageSize}
          className="w-full rounded-xl border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
        >
          Apply
        </button>
      </form>

      {ok && (
        <div className="mb-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {ok === "updated" ? "Invoice updated." : "Success."}
        </div>
      )}
      {err && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {err === "update_failed" ? "Update failed." : "Error."}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-3 py-2">Number</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Currency</th>
              <th className="px-3 py-2">Issued</th>
              <th className="px-3 py-2">Due</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-gray-500" colSpan={7}>
                  No invoices found.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const amt =
                  typeof r.total_amount === "number" ? r.total_amount : 0;
                const cur = (r.currency ?? "PKR").toUpperCase();
                const issued = r.issued_at
                  ? new Date(r.issued_at).toDateString()
                  : "—";
                const due = r.due_date
                  ? new Date(r.due_date).toDateString()
                  : "—";

                return (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">
                      <div className="font-medium">
                        {r.number ?? r.id.slice(0, 8).toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {r.description ?? "—"}
                      </div>
                    </td>
                    <td className="px-3 py-2">{(r.status ?? "").toUpperCase()}</td>
                    <td className="px-3 py-2">{amt}</td>
                    <td className="px-3 py-2">{cur}</td>
                    <td className="px-3 py-2">{issued}</td>
                    <td className="px-3 py-2">{due}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/landlord/invoices/${r.id}/edit`}
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/tenant/invoices/${r.id}`}
                          className="text-gray-600 hover:underline"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="text-gray-600">
          Showing {rows.length} of {total} • Page {pageNum}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={hasPrev ? buildPageHref(pageNum - 1) : "#"}
            className={`rounded-xl border px-3 py-2 ${
              hasPrev ? "hover:bg-gray-50" : "pointer-events-none opacity-40"
            }`}
          >
            ← Prev
          </Link>
          <Link
            href={hasNext ? buildPageHref(pageNum + 1) : "#"}
            className={`rounded-xl border px-3 py-2 ${
              hasNext ? "hover:bg-gray-50" : "pointer-events-none opacity-40"
            }`}
          >
            Next →
          </Link>
        </div>
      </div>
    </div>
  );
}
