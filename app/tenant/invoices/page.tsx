// app/tenant/invoices/page.tsx
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

type SearchParam = string | string[] | undefined;

function getString(sp: URLSearchParams, key: string, def = ""): string {
  const v = sp.get(key);
  return v ?? def;
}
function getNumber(sp: URLSearchParams, key: string, def: number): number {
  const v = sp.get(key);
  if (!v) return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}
function getSort(sp: URLSearchParams) {
  const sortBy = sp.get("sortBy") ?? "issued_at";
  const dir = (sp.get("dir") ?? "desc").toLowerCase() === "asc" ? "asc" : "desc";
  return { sortBy, dir };
}

function withPage(sp: URLSearchParams, page: number) {
  const next = new URLSearchParams(sp.toString());
  if (page <= 1) next.delete("page");
  else next.set("page", String(page));
  return `?${next.toString()}`;
}

function amountDisplay(total_amount: number | null | undefined, amount_cents: number | null | undefined, currency: string | null | undefined) {
  const amt =
    typeof total_amount === "number"
      ? total_amount
      : typeof amount_cents === "number"
      ? Math.round(amount_cents) / 100
      : 0;
  return `${amt} ${currency ?? "PKR"}`;
}

type InvoiceRow = {
  id: string;
  number: string | null;
  status: string | null;
  issued_at: string | null;
  due_date: string | null;
  total_amount: number | null;
  amount_cents: number | null;
  currency: string | null;
  description: string | null;
};

export const dynamic = "force-dynamic";

export default async function TenantInvoicesPage({
  searchParams,
}: {
  searchParams: Record<string, SearchParam>;
}) {
  const sp = new URLSearchParams(
    Object.entries(searchParams)
      .filter(([, v]) => v !== undefined)
      .flatMap(([k, v]) => (Array.isArray(v) ? v.map((x) => [k, x]) : [[k, v as string]]))
  );

  const q = getString(sp, "q", "");
  const status = getString(sp, "status", "all"); // 'all' | 'open' | 'paid' (more statuses later)
  const issued_from = getString(sp, "issued_from", "");
  const issued_to = getString(sp, "issued_to", "");
  const min_amount = getString(sp, "min_amount", "");
  const max_amount = getString(sp, "max_amount", "");
  const page = getNumber(sp, "page", 1);
  const per_page = getNumber(sp, "per_page", 10);
  const { sortBy, dir } = getSort(sp);
  const ascending = dir === "asc";

  const from = (page - 1) * per_page;
  const to = from + per_page - 1;

  const supabase = createServerSupabase();

  // ---- DATA QUERY (with filters) ----
  let dataQuery = supabase
    .from("invoices")
    .select(
      "id, number, status, issued_at, due_date, total_amount, amount_cents, currency, description"
    );

  // status filter
  if (status && status !== "all") {
    dataQuery = dataQuery.eq("status", status);
  }

  // search q on number/description
  if (q) {
    const pattern = `%${q}%`;
    // supabase-js v2 .or uses PostgREST filter syntax
    dataQuery = dataQuery.or(
      `number.ilike.${pattern},description.ilike.${pattern}`
    );
  }

  // issued_at date range
  if (issued_from) {
    dataQuery = dataQuery.gte("issued_at", issued_from);
  }
  if (issued_to) {
    // keep simple; Postgres will handle date-only string compare for timestamp/date columns
    dataQuery = dataQuery.lte("issued_at", issued_to);
  }

  // NOTE: amount range currently checks total_amount only (works with our seeded data).
  // If some rows only have amount_cents, we’ll enhance this later with a view/virtual column.
  if (min_amount) {
    const minN = Number(min_amount);
    if (Number.isFinite(minN)) dataQuery = dataQuery.gte("total_amount", minN);
  }
  if (max_amount) {
    const maxN = Number(max_amount);
    if (Number.isFinite(maxN)) dataQuery = dataQuery.lte("total_amount", maxN);
  }

  // sorting
  const sortableMap: Record<string, string> = {
    issued_at: "issued_at",
    due_date: "due_date",
    amount: "total_amount",
    number: "number",
  };
  const sortColumn = sortableMap[sortBy] ?? "issued_at";
  dataQuery = dataQuery.order(sortColumn, { ascending, nullsFirst: false });

  // range (pagination)
  dataQuery = dataQuery.range(from, to);

  const { data: rows, error: dataError } = await dataQuery;

  // ---- COUNT QUERY (same filters, head: true) ----
  let countQuery = supabase.from("invoices").select("id", { count: "exact", head: true });
  if (status && status !== "all") countQuery = countQuery.eq("status", status);
  if (q) {
    const pattern = `%${q}%`;
    countQuery = countQuery.or(`number.ilike.${pattern},description.ilike.${pattern}`);
  }
  if (issued_from) countQuery = countQuery.gte("issued_at", issued_from);
  if (issued_to) countQuery = countQuery.lte("issued_at", issued_to);
  if (min_amount) {
    const minN = Number(min_amount);
    if (Number.isFinite(minN)) countQuery = countQuery.gte("total_amount", minN);
  }
  if (max_amount) {
    const maxN = Number(max_amount);
    if (Number.isFinite(maxN)) countQuery = countQuery.lte("total_amount", maxN);
  }
  const { count, error: countError } = await countQuery;

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / per_page));

  // UI strings
  const headerTitle = "Invoices";
  const headerSub = "Transparent amounts, clear status, quick receipts (when paid).";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500">Tenant</div>
          <h1 className="text-2xl font-semibold">{headerTitle}</h1>
          <p className="text-sm text-gray-600">{headerSub}</p>
        </div>
        <Link
          href="/tenant"
          className="text-sm underline underline-offset-4 hover:opacity-80"
        >
          Back to dashboard
        </Link>
      </div>

      {/* Filters */}
      <form method="get" className="mb-4 grid grid-cols-1 gap-3 rounded-xl border p-3 md:grid-cols-4">
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500">Search</label>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Number or description…"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500">Status</label>
          <select
            name="status"
            defaultValue={status}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500">Sort by</label>
          <div className="mt-1 flex gap-2">
            <select
              name="sortBy"
              defaultValue={sortBy}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="issued_at">Issued date</option>
              <option value="due_date">Due date</option>
              <option value="amount">Amount</option>
              <option value="number">Invoice #</option>
            </select>
            <select
              name="dir"
              defaultValue={dir}
              className="w-28 rounded-lg border px-3 py-2 text-sm"
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500">Issued from</label>
          <input
            type="date"
            name="issued_from"
            defaultValue={issued_from}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500">Issued to</label>
          <input
            type="date"
            name="issued_to"
            defaultValue={issued_to}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500">Min amount</label>
          <input
            type="number"
            name="min_amount"
            inputMode="decimal"
            step="0.01"
            defaultValue={min_amount}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500">Max amount</label>
          <input
            type="number"
            name="max_amount"
            inputMode="decimal"
            step="0.01"
            defaultValue={max_amount}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500">Per page</label>
          <select
            name="per_page"
            defaultValue={String(per_page)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>

        <div className="flex items-end justify-end gap-2 md:col-span-4">
          <Link
            href="/tenant/invoices"
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Reset
          </Link>
          <button
            type="submit"
            className="rounded-lg bg-black px-3 py-2 text-sm text-white hover:opacity-90"
          >
            Apply
          </button>
        </div>
      </form>

      {/* Results */}
      <div className="rounded-xl border">
        <div className="grid grid-cols-12 gap-2 border-b bg-gray-50 px-3 py-2 text-xs text-gray-600">
          <div className="col-span-3">Invoice</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Issued</div>
          <div className="col-span-2">Due</div>
          <div className="col-span-3 text-right">Amount</div>
        </div>

        {dataError ? (
          <div className="px-4 py-8 text-sm text-red-600">
            Couldn’t load invoices. Please try again.
          </div>
        ) : !rows || rows.length === 0 ? (
          <div className="px-4 py-10 text-sm">
            <div className="mb-1 font-medium">No invoices yet</div>
            <div className="text-gray-600">
              When your landlord issues an invoice, it’ll show up here with its status and due date.
            </div>
          </div>
        ) : (
          <ul className="divide-y">
            {(rows as InvoiceRow[]).map((inv) => {
              const number = inv.number ?? inv.id.slice(0, 8).toUpperCase();
              const issued = inv.issued_at ? new Date(inv.issued_at).toDateString() : "—";
              const due = inv.due_date ? new Date(inv.due_date).toDateString() : "—";
              const amount = amountDisplay(inv.total_amount, inv.amount_cents, inv.currency);

              return (
                <li key={inv.id}>
                  <Link
                    href={`/tenant/invoices/${inv.id}`}
                    className="grid grid-cols-12 gap-2 px-3 py-3 hover:bg-gray-50"
                  >
                    <div className="col-span-3">
                      <div className="font-medium">#{number}</div>
                      <div className="text-xs text-gray-600 line-clamp-1">
                        {inv.description ?? "—"}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize">
                        {(inv.status ?? "").toLowerCase() || "—"}
                      </span>
                    </div>
                    <div className="col-span-2 text-sm">{issued}</div>
                    <div className="col-span-2 text-sm">{due}</div>
                    <div className="col-span-3 text-right text-sm">{amount}</div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Pager */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="text-gray-600">
          Showing <span className="font-medium">{rows?.length ?? 0}</span> of{" "}
          <span className="font-medium">{total}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={withPage(sp, Math.max(1, page - 1))}
            className={`rounded-lg border px-3 py-2 ${
              page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-gray-50"
            }`}
          >
            Previous
          </Link>
          <div className="text-gray-600">
            Page <span className="font-medium">{page}</span> of{" "}
            <span className="font-medium">{totalPages}</span>
          </div>
          <Link
            href={withPage(sp, Math.min(totalPages, page + 1))}
            className={`rounded-lg border px-3 py-2 ${
              page >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-gray-50"
            }`}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
