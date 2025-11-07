// app/tenant/invoices/page.tsx
import { createRouteSupabase } from "@/lib/supabase/server";
import Link from "next/link";

export const runtime = "nodejs";

type InvoiceRow = {
  id: string;
  number: string | null;
  status: string | null; // 'open' | 'paid'
  issued_at: string | null;
  due_date: string | null;
  total_amount: number | null;
  amount_cents: number | null;
  currency: string | null;
  description: string | null;
};

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(dt);
}

function safeCurrency(c: string | null | undefined) {
  const v = (c ?? "PKR").toUpperCase().trim();
  return v || "PKR";
}

function fmtAmount(total: number | null | undefined, cents: number | null | undefined, currency: string | null | undefined) {
  const cur = safeCurrency(currency);
  const n =
    typeof total === "number"
      ? total
      : typeof cents === "number"
      ? Math.round(cents) / 100
      : 0;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur,
      minimumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${cur}`;
  }
}

function buildQueryString(
  base: Record<string, string | undefined>,
  patch: Record<string, string | undefined>
) {
  const u = new URLSearchParams();
  const merged: Record<string, string | undefined> = { ...base, ...patch };
  for (const [k, v] of Object.entries(merged)) {
    if (v && v.length > 0) u.set(k, v);
  }
  return `?${u.toString()}`;
}

export default async function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const supabase = createRouteSupabase();

  // Read filters from URL
  const status = (searchParams.status ?? "all").toLowerCase();
  const qRaw = (searchParams.q ?? "").trim();
  const q = qRaw.length ? qRaw : undefined;

  const sort = (searchParams.sort ?? "due_date") as "due_date" | "issued_at" | "total_amount";
  const dir = (searchParams.dir ?? "desc") as "asc" | "desc";

  const pageSize = 10;
  const pageNum = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);
  const from = (pageNum - 1) * pageSize;
  const to = from + pageSize - 1;

  // Base select with count for pagination
  let query = supabase
    .from("invoices")
    .select(
      "id, number, status, issued_at, due_date, total_amount, amount_cents, currency, description",
      { count: "exact" }
    );

  if (status !== "all") {
    query = query.eq("status", status);
  }

  if (q) {
    // Use OR to search number or description (escape commas for filter syntax)
    const needle = q.replace(/,/g, ""); // crude escape to avoid breaking filter
    query = query.or(`number.ilike.%${needle}%,description.ilike.%${needle}%`);
  }

  query = query
    .order(sort, { ascending: dir === "asc", nullsFirst: false })
    .range(from, to);

  const { data, error, count } = await query;

  const rows = (data ?? []) as InvoiceRow[];
  const total = Math.max(0, count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <Link
          href="/tenant"
          className="text-sm text-blue-600 hover:underline"
        >
          Back to dashboard
        </Link>
      </div>

      {/* Filters / Search */}
      <form method="get" className="mb-6 grid gap-3 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Status</label>
          <select
            name="status"
            defaultValue={status}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-gray-500">Search</label>
          <input
            name="q"
            defaultValue={qRaw}
            placeholder="Search by number or description…"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Sort by</label>
            <select
              name="sort"
              defaultValue={sort}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="due_date">Due date</option>
              <option value="issued_at">Issued date</option>
              <option value="total_amount">Amount</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Direction</label>
            <select
              name="dir"
              defaultValue={dir}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>

        <div className="sm:col-span-4">
          {/* When submitting, omit page param so it resets to page 1 */}
          <button
            type="submit"
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Apply
          </button>
        </div>
      </form>

      {/* Results */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load invoices. Please try again.
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border bg-white px-4 py-10 text-center text-sm text-gray-600">
          <div className="mb-1 font-medium">No invoices found</div>
          <div>Try adjusting filters or search terms.</div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Issued</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => {
                const number = inv.number ?? inv.id.slice(0, 8).toUpperCase();
                const amount = fmtAmount(inv.total_amount, inv.amount_cents, inv.currency);
                const statusLabel = (inv.status ?? "").toUpperCase() || "—";
                const badge =
                  statusLabel === "PAID"
                    ? "inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20"
                    : "inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20";

                const qs = buildQueryString(searchParams, {});
                const back = `/tenant/invoices${qs}`;

                return (
                  <tr key={inv.id} className="border-t">
                    <td className="px-4 py-3">
                      <Link
                        href={`/tenant/invoices/${inv.id}?return=${encodeURIComponent(
                          back
                        )}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {number}
                      </Link>
                      {inv.description ? (
                        <div className="mt-0.5 text-xs text-gray-500 line-clamp-1">
                          {inv.description}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className={badge}>{statusLabel}</span>
                    </td>
                    <td className="px-4 py-3">{fmtDate(inv.issued_at)}</td>
                    <td className="px-4 py-3">{fmtDate(inv.due_date)}</td>
                    <td className="px-4 py-3 text-right">{amount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pager */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div>
          Page <span className="font-medium">{pageNum}</span> of{" "}
          <span className="font-medium">{totalPages}</span>
          {total > 0 ? (
            <span className="ml-2">• {total} total</span>
          ) : null}
        </div>
        <div className="flex gap-2">
          {pageNum > 1 ? (
            <Link
              href={buildQueryString(searchParams, {
                page: String(pageNum - 1),
              })}
              className="rounded-lg border px-3 py-1 hover:bg-gray-50"
            >
              ← Prev
            </Link>
          ) : (
            <span className="cursor-not-allowed rounded-lg border px-3 py-1 opacity-50">
              ← Prev
            </span>
          )}
          {pageNum < totalPages ? (
            <Link
              href={buildQueryString(searchParams, {
                page: String(pageNum + 1),
              })}
              className="rounded-lg border px-3 py-1 hover:bg-gray-50"
            >
              Next →
            </Link>
          ) : (
            <span className="cursor-not-allowed rounded-lg border px-3 py-1 opacity-50">
              Next →
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
