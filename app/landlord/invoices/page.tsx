// app/landlord/invoices/page.tsx
import Link from "next/link";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

type InvoiceListRow = {
  id: string;
  number: string | null;
  description: string | null;
  status: string | null;
  total_amount: number | null;
  amount_cents: number | null;
  currency: string | null;
  issued_at: string | null;
  due_date: string | null;
  tenant_id: string | null;
};

const PAGE_SIZE = 10;
const ALLOWED_STATUS = ["open", "issued", "paid", "overdue", "draft"] as const;
const ALLOWED_SORT = ["issued_at", "due_date"] as const;

function qp(base: URL, next: Record<string, string | undefined>) {
  const u = new URL(base);
  Object.entries(next).forEach(([k, v]) => {
    if (v == null || v === "") u.searchParams.delete(k);
    else u.searchParams.set(k, v);
  });
  return u.toString();
}

export default async function LandlordInvoicesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const supabase = createRouteSupabase();

  const q =
    typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const stRaw =
    typeof searchParams.st === "string" ? searchParams.st.trim().toLowerCase() : "";
  const st = ALLOWED_STATUS.includes(stRaw as any) ? stRaw : "";
  const sortRaw =
    typeof searchParams.sort === "string" ? searchParams.sort.trim() : "";
  const sort: (typeof ALLOWED_SORT)[number] = (ALLOWED_SORT as readonly string[]).includes(sortRaw)
    ? (sortRaw as (typeof ALLOWED_SORT)[number])
    : "issued_at";
  const dirRaw =
    typeof searchParams.dir === "string" ? searchParams.dir.trim().toLowerCase() : "desc";
  const asc = dirRaw === "asc";
  const page = Math.max(
    1,
    Number.isFinite(Number(searchParams.page)) ? Number(searchParams.page) : 1
  );

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("invoices")
    .select(
      "id, number, description, status, total_amount, amount_cents, currency, issued_at, due_date, tenant_id",
      { count: "exact" }
    );

  if (q) {
    // match on number or description (ILIKE)
    query = query.or(`number.ilike.%${q}%,description.ilike.%${q}%`);
  }

  if (st) {
    query = query.eq("status", st);
  }

  query = query.order(sort, { ascending: asc }).range(from, to);

  const { data, count, error } = await query;

  const rows = (data ?? []) as InvoiceListRow[];
  const total = typeof count === "number" && count >= 0 ? count : rows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const current = new URL("https://dummy.local/landlord/invoices");
  if (q) current.searchParams.set("q", q);
  if (st) current.searchParams.set("st", st);
  if (sort) current.searchParams.set("sort", sort);
  current.searchParams.set("dir", asc ? "asc" : "desc");
  current.searchParams.set("page", String(page));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-sm">
            <Link href="/landlord" className="text-blue-600 hover:underline">
              ← Back to landlord
            </Link>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-gray-600">
            Search, filter, sort, and edit invoices.
          </p>
        </div>
        <Link
          href="/landlord/invoices/new"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          + Create invoice
        </Link>
      </div>

      {/* Controls */}
      <form method="get" className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <input
          type="text"
          name="q"
          placeholder="Search number or description…"
          defaultValue={q}
          className="rounded-xl border px-3 py-2 text-sm"
        />
        <select
          name="st"
          defaultValue={st}
          className="rounded-xl border px-3 py-2 text-sm"
        >
          <option value="">All status</option>
          {ALLOWED_STATUS.map((s) => (
            <option key={s} value={s}>
              {s.toUpperCase()}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <select
            name="sort"
            defaultValue={sort}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          >
            <option value="issued_at">Sort by ISSUED</option>
            <option value="due_date">Sort by DUE</option>
          </select>
          <select
            name="dir"
            defaultValue={asc ? "asc" : "desc"}
            className="w-32 rounded-xl border px-3 py-2 text-sm"
          >
            <option value="desc">DESC</option>
            <option value="asc">ASC</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Apply
          </button>
          <Link
            href="/landlord/invoices"
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Reset
          </Link>
        </div>
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-2">Number</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Issued</th>
              <th className="px-4 py-2">Due</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No invoices found.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const amt =
                  typeof r.total_amount === "number"
                    ? r.total_amount
                    : typeof r.amount_cents === "number"
                    ? Math.round(r.amount_cents) / 100
                    : 0;
                const cur = (r.currency ?? "PKR").toUpperCase();
                const issued = r.issued_at
                  ? new Date(r.issued_at).toDateString()
                  : "—";
                const due = r.due_date
                  ? new Date(r.due_date).toDateString()
                  : "—";
                const num = r.number ?? r.id.slice(0, 8).toUpperCase();

                return (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-2">
                      <Link
                        href={`/tenant/invoices/${r.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {num}
                      </Link>
                    </td>
                    <td className="px-4 py-2 uppercase text-gray-700">
                      {String(r.status ?? "").toUpperCase() || "—"}
                    </td>
                    <td className="px-4 py-2">
                      {amt} {cur}
                    </td>
                    <td className="px-4 py-2">{issued}</td>
                    <td className="px-4 py-2">{due}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/landlord/invoices/${r.id}/edit`}
                          className="rounded-xl border px-3 py-1 hover:bg-gray-50"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/api/tenant/invoices/${r.id}/pdf`}
                          className="rounded-xl border px-3 py-1 hover:bg-gray-50"
                        >
                          PDF
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

      {/* Pager (preserves filters/sort) */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="text-gray-600">
          {rows.length > 0
            ? `Showing ${from + 1}–${Math.min(to + 1, total)} of ${total}`
            : "No results"}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={qp(current, { page: String(Math.max(1, page - 1)) })}
            className={`rounded-xl border px-3 py-1 ${
              page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-gray-50"
            }`}
          >
            ← Prev
          </Link>
          <span className="text-gray-600">
            Page {page} / {totalPages}
          </span>
          <Link
            href={qp(current, {
              page: String(Math.min(totalPages, page + 1)),
            })}
            className={`rounded-xl border px-3 py-1 ${
              page >= totalPages
                ? "pointer-events-none opacity-40"
                : "hover:bg-gray-50"
            }`}
          >
            Next →
          </Link>
        </div>
      </div>
    </div>
  );
}
