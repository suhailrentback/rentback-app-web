// app/tenant/invoices/page.tsx
import Link from "next/link";
import { createRouteSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SearchParams = { [key: string]: string | string[] | undefined };

const PAGE_SIZE = 10 as const;
const ALLOWED_STATUS = new Set(["open", "issued", "paid", "overdue", "void"]);
const SORT_MAP: Record<
  string,
  { col: "issued_at" | "due_date" | "total_amount"; asc: boolean }
> = {
  issued_desc: { col: "issued_at", asc: false },
  issued_asc: { col: "issued_at", asc: true },
  due_desc: { col: "due_date", asc: false },
  due_asc: { col: "due_date", asc: true },
  amount_desc: { col: "total_amount", asc: false },
  amount_asc: { col: "total_amount", asc: true },
};

function spGet(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function buildQS(sp: SearchParams, overrides: Record<string, string | null>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === "from") continue;
    if (typeof v === "string") {
      if (v) qs.set(k, v);
    } else if (Array.isArray(v)) {
      for (const item of v) if (item) qs.append(k, item);
    }
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v === null) qs.delete(k);
    else qs.set(k, v);
  }
  return qs.toString();
}

export default async function TenantInvoicesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createRouteSupabase();

  const q = (spGet(searchParams, "q") || "").trim();
  const statusRaw = (spGet(searchParams, "status") || "").toLowerCase();
  const status = ALLOWED_STATUS.has(statusRaw) ? statusRaw : "";
  const cur = (spGet(searchParams, "cur") || "").toUpperCase();
  const issuedFrom = spGet(searchParams, "from_date") || "";
  const issuedTo = spGet(searchParams, "to_date") || "";
  const sortKey = spGet(searchParams, "sort") || "issued_desc";
  const sort = SORT_MAP[sortKey] ?? SORT_MAP["issued_desc"];
  const page = Math.max(1, parseInt(spGet(searchParams, "p") || "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("invoices")
    .select(
      "id, number, status, total_amount, currency, description, issued_at, due_date",
      { count: "exact" }
    );

  if (status) query = query.eq("status", status);
  if (cur) query = query.eq("currency", cur);
  if (issuedFrom) query = query.gte("issued_at", issuedFrom);
  if (issuedTo) query = query.lte("issued_at", issuedTo);

  if (q) {
    const like = `%${q}%`;
    query = query.or(`number.ilike.${like},description.ilike.${like}` as any);
  }

  query = query.order(sort.col, { ascending: sort.asc, nullsFirst: false }).range(from, to);

  const { data: rows, error, count } = await query;

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentQS = buildQS(searchParams, {});

  if (error) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/tenant" className="text-sm text-blue-600 hover:underline">
            ← Back to dashboard
          </Link>
          <Link href="/sign-out" className="text-xs text-gray-500 hover:underline">
            Sign out
          </Link>
        </div>
        <h1 className="text-xl font-semibold">Invoices</h1>
        <p className="mt-1 text-sm text-gray-600">
          Transparent amounts, clear status, quick receipts (when paid).
        </p>
        <div className="mt-6 rounded-2xl border p-4">
          <p className="text-sm text-red-600">Failed to load invoices.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/tenant" className="text-sm text-blue-600 hover:underline">
          ← Back to dashboard
        </Link>
        <Link href="/sign-out" className="text-xs text-gray-500 hover:underline">
          Sign out
        </Link>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold">Invoices</h1>
          <p className="mt-1 text-sm text-gray-600">
            Transparent amounts, clear status, quick receipts (when paid).
          </p>
        </div>
        <a
          href={`/api/tenant/invoices/export?${currentQS}`}
          className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
        >
          Export CSV
        </a>
      </div>

      {/* Filters */}
      <form method="GET" className="mt-6 rounded-2xl border p-4">
        <input type="hidden" name="p" value="1" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-gray-500">Search</label>
            <input
              name="q"
              defaultValue={q}
              placeholder="Invoice # or description"
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">Status</label>
            <select
              name="status"
              defaultValue={status || ""}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="issued">Issued</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="void">Void</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">Currency</label>
            <input
              name="cur"
              maxLength={6}
              defaultValue={cur}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="PKR / USD"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">Issued from</label>
            <input
              type="date"
              name="from_date"
              defaultValue={issuedFrom}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">Issued to</label>
            <input
              type="date"
              name="to_date"
              defaultValue={issuedTo}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">Sort</label>
            <select
              name="sort"
              defaultValue={sortKey}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            >
              <option value="issued_desc">Issued date ↓</option>
              <option value="issued_asc">Issued date ↑</option>
              <option value="due_desc">Due date ↓</option>
              <option value="due_asc">Due date ↑</option>
              <option value="amount_desc">Amount ↓</option>
              <option value="amount_asc">Amount ↑</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="submit"
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Apply
          </button>
          <Link
            href="/tenant/invoices"
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Reset
          </Link>
          <div className="ml-auto text-xs text-gray-500">
            {total} result{total === 1 ? "" : "s"}
          </div>
        </div>
      </form>

      {/* Results */}
      <div className="mt-6 overflow-hidden rounded-2xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-4 py-2 text-left">Invoice #</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2 text-left">Currency</th>
              <th className="px-4 py-2 text-left">Issued</th>
              <th className="px-4 py-2 text-left">Due</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {(rows || []).length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                  No invoices yet
                  <div className="mt-1 text-xs">
                    When your landlord issues an invoice, it’ll show up here with its
                    status and due date.
                  </div>
                </td>
              </tr>
            ) : (
              (rows || []).map((inv: any) => {
                const issued =
                  inv.issued_at ? new Date(inv.issued_at).toDateString() : "—";
                const due = inv.due_date ? new Date(inv.due_date).toDateString() : "—";
                const amount =
                  typeof inv.total_amount === "number" ? inv.total_amount : 0;
                const badgeClasses =
                  inv.status === "paid"
                    ? "bg-green-50 text-green-800 border-green-200"
                    : inv.status === "overdue"
                    ? "bg-red-50 text-red-800 border-red-200"
                    : inv.status === "issued"
                    ? "bg-blue-50 text-blue-800 border-blue-200"
                    : inv.status === "void"
                    ? "bg-gray-50 text-gray-700 border-gray-200"
                    : "bg-yellow-50 text-yellow-800 border-yellow-200";

                const backQS = encodeURIComponent(buildQS(searchParams, {}));
                const detailHref = `/tenant/invoices/${inv.id}?from=${backQS}`;

                return (
                  <tr key={inv.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 align-top">
                      <Link
                        href={detailHref}
                        className="text-blue-600 hover:underline"
                      >
                        {inv.number || inv.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-2 align-top">
                      <div className="line-clamp-2 max-w-xs">{inv.description}</div>
                    </td>
                    <td className="px-4 py-2 align-top">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${badgeClasses}`}>
                        {String(inv.status || "").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right align-top">{amount}</td>
                    <td className="px-4 py-2 align-top">{inv.currency || "PKR"}</td>
                    <td className="px-4 py-2 align-top">{issued}</td>
                    <td className="px-4 py-2 align-top">{due}</td>
                    <td className="px-4 py-2 align-top text-right">
                      <Link
                        href={detailHref}
                        className="rounded-xl border px-2 py-1 text-xs hover:bg-gray-50"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pager */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link
              href={`/tenant/invoices?${buildQS(searchParams, { p: String(page - 1) })}`}
              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
            >
              ← Prev
            </Link>
          ) : (
            <span className="cursor-not-allowed rounded-xl border px-3 py-2 text-sm opacity-50">
              ← Prev
            </span>
          )}
          {page < totalPages ? (
            <Link
              href={`/tenant/invoices?${buildQS(searchParams, { p: String(page + 1) })}`}
              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Next →
            </Link>
          ) : (
            <span className="cursor-not-allowed rounded-xl border px-3 py-2 text-sm opacity-50">
              Next →
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
