// app/tenant/invoices/page.tsx
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type SearchParams = {
  q?: string;
  status?: string;
  from?: string;
  to?: string;
  sort?: "due_date" | "issued_at" | "total_amount" | "number";
  dir?: "asc" | "desc";
  page?: string;
};

type InvoiceRow = {
  id: string;
  number: string | null;
  status: string | null;
  issued_at: string | null;
  due_date: string | null;
  total_amount: number | null;
  currency: string | null;
  description?: string | null;
};

function formatDate(iso?: string | null) {
  return iso ? new Date(iso).toDateString() : "—";
}
function formatMoney(amount?: number | null, ccy?: string | null) {
  if (amount == null) return "—";
  const value = typeof amount === "number" ? amount : Number(amount);
  return `${value} ${String(ccy ?? "").toUpperCase()}`;
}

export default async function TenantInvoicesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // defaults
  const q = (searchParams.q ?? "").trim();
  const status = (searchParams.status ?? "").toLowerCase();
  const from = searchParams.from ? new Date(searchParams.from) : null;
  const to = searchParams.to ? new Date(searchParams.to) : null;
  const sort = (searchParams.sort as SearchParams["sort"]) || "due_date";
  const dir = (searchParams.dir as SearchParams["dir"]) || "desc";
  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);
  const pageSize = 10;
  const fromIdx = (page - 1) * pageSize;
  const toIdx = fromIdx + pageSize - 1;

  const jar = cookies();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: { get: (name: string) => jar.get(name)?.value },
  });

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <h1 className="text-xl font-semibold mb-2">Invoices</h1>
        <p className="text-sm text-gray-600">
          Please sign in to view your invoices.
        </p>
      </div>
    );
  }

  // Build query
  let query = supabase
    .from("invoices")
    .select(
      "id, number, status, issued_at, due_date, total_amount, currency, description",
      { count: "exact" }
    )
    .eq("tenant_id", uid);

  if (status && ["open", "paid", "overdue", "issued", "draft"].includes(status)) {
    query = query.eq("status", status);
  }
  if (from) {
    query = query.gte("due_date", from.toISOString());
  }
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    query = query.lte("due_date", end.toISOString());
  }
  if (q) {
    query = query.or(`number.ilike.%${q}%,description.ilike.%${q}%`);
  }

  // sort
  const allowedSort: Record<string, true> = {
    due_date: true,
    issued_at: true,
    total_amount: true,
    number: true,
  };
  const sortCol = allowedSort[sort] ? sort : "due_date";
  query = query.order(sortCol as any, { ascending: dir === "asc", nullsFirst: false });

  // paginate
  query = query.range(fromIdx, toIdx);

  const { data, count, error } = await query;

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <h1 className="text-xl font-semibold mb-2">Invoices</h1>
        <p className="text-sm text-red-600">Failed to load invoices.</p>
        <pre className="mt-3 rounded bg-gray-100 p-3 text-xs overflow-auto">
          {error.message}
        </pre>
      </div>
    );
  }

  const rows = (data as unknown as InvoiceRow[]) || [];
  const total = typeof count === "number" ? count : rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const buildUrl = (nextPage: number, extras?: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status) sp.set("status", status);
    if (searchParams.from) sp.set("from", searchParams.from);
    if (searchParams.to) sp.set("to", searchParams.to);
    if (sort) sp.set("sort", sort);
    if (dir) sp.set("dir", dir);
    sp.set("page", String(nextPage));
    if (extras) {
      for (const [k, v] of Object.entries(extras)) {
        if (v == null || v === "") sp.delete(k);
        else sp.set(k, v);
      }
    }
    const qs = sp.toString();
    return qs ? `/tenant/invoices?${qs}` : `/tenant/invoices`;
  };

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <h1 className="text-xl font-semibold mb-4">Invoices</h1>

      {/* Filters */}
      <form
        method="GET"
        action="/tenant/invoices"
        className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-6"
      >
        <input
          className="col-span-2 rounded-xl border px-3 py-2 text-sm"
          type="text"
          name="q"
          placeholder="Search number or description"
          defaultValue={q}
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded-xl border px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
        <input
          className="rounded-xl border px-3 py-2 text-sm"
          type="date"
          name="from"
          defaultValue={searchParams.from ?? ""}
        />
        <input
          className="rounded-xl border px-3 py-2 text-sm"
          type="date"
          name="to"
          defaultValue={searchParams.to ?? ""}
        />
        <div className="flex gap-2">
          <select
            name="sort"
            defaultValue={sort}
            className="flex-1 rounded-xl border px-3 py-2 text-sm"
          >
            <option value="due_date">Sort: Due date</option>
            <option value="issued_at">Sort: Issued</option>
            <option value="total_amount">Sort: Amount</option>
            <option value="number">Sort: Number</option>
          </select>
          <select
            name="dir"
            defaultValue={dir}
            className="rounded-xl border px-3 py-2 text-sm"
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
        {/* reset page to 1 on every search */}
        <input type="hidden" name="page" value="1" />
        <div className="md:col-span-6 flex gap-2">
          <button
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
            type="submit"
          >
            Apply
          </button>
          <Link
            href="/tenant/invoices"
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Reset
          </Link>
        </div>
      </form>

      {/* Results */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border p-6 text-sm text-gray-600">
          No invoices match your filters.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((inv) => (
            <li key={inv.id} className="rounded-2xl border p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  {inv.number ?? inv.id}
                  <span className="ml-2 rounded-full border px-2 py-0.5 text-xs">
                    {String(inv.status ?? "").toUpperCase() || "—"}
                  </span>
                </div>
                <Link href={`/tenant/invoices/${inv.id}`} className="text-sm underline">
                  View
                </Link>
              </div>
              <div className="mt-2 text-sm text-gray-700">
                <div>Issued: {formatDate(inv.issued_at)}</div>
                <div>Due: {formatDate(inv.due_date)}</div>
                <div>Total: {formatMoney(inv.total_amount, inv.currency)}</div>
                {inv.description ? (
                  <div className="mt-1 text-gray-600">{inv.description}</div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Pager */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div>
          Page {page} of {totalPages}
        </div>
        <div className="flex gap-2">
          <Link
            aria-disabled={page <= 1}
            href={buildUrl(Math.max(1, page - 1))}
            className={`rounded-xl border px-3 py-2 ${
              page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-gray-50"
            }`}
          >
            Prev
          </Link>
          <Link
            aria-disabled={page >= totalPages}
            href={buildUrl(Math.min(totalPages, page + 1))}
            className={`rounded-xl border px-3 py-2 ${
              page >= totalPages
                ? "pointer-events-none opacity-50"
                : "hover:bg-gray-50"
            }`}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
