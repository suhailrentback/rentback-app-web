// app/tenant/invoices/page.tsx
import Link from "next/link";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

type InvoiceRow = {
  id: string;
  number: string | null;
  status: string | null;
  total_amount: number | null;
  currency: string | null;
  issued_at: string | null;
  due_date: string | null;
  description: string | null;
};

const STATUS_OPTIONS = ["issued", "paid", "overdue", "open"] as const;
const SORT_OPTIONS = [
  { value: "issued_desc", label: "Issued (newest)" },
  { value: "issued_asc", label: "Issued (oldest)" },
  { value: "due_asc", label: "Due (soonest)" },
  { value: "due_desc", label: "Due (latest)" },
  { value: "amount_desc", label: "Amount (high→low)" },
  { value: "amount_asc", label: "Amount (low→high)" },
] as const;

function fmtDate(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "—";
  return d.toDateString();
}

function qp(
  basePath: string,
  params: Record<string, string | number | undefined>
) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === "") return;
    sp.set(k, String(v));
  });
  const q = sp.toString();
  return q ? `${basePath}?${q}` : basePath;
}

export default async function TenantInvoicesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const supabase = createRouteSupabase();

  // Read filters from query
  const q = (searchParams.q ?? "")!.toString().trim();
  const status = (searchParams.status ?? "")!.toString().trim().toLowerCase();
  const issued_from = (searchParams.issued_from ?? "")!.toString().trim();
  const issued_to = (searchParams.issued_to ?? "")!.toString().trim();
  const sort = (searchParams.sort ?? "issued_desc")!.toString();
  const limit = Math.min(
    50,
    Math.max(5, parseInt((searchParams.limit ?? "10").toString(), 10) || 10)
  );
  const page = Math.max(1, parseInt((searchParams.page ?? "1").toString(), 10) || 1);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Build query (RLS will scope to this tenant automatically)
  let query = supabase
    .from("invoices")
    .select(
      "id, number, status, total_amount, currency, due_date, issued_at, description",
      { count: "exact" }
    );

  if (q) {
    // Search in number OR description
    query = query.or(
      `number.ilike.%${q.replace(/%/g, "")}%,description.ilike.%${q.replace(/%/g, "")}%`
    );
  }

  if (status && STATUS_OPTIONS.includes(status as any)) {
    query = query.eq("status", status);
  }

  if (issued_from) {
    const iso = new Date(issued_from).toISOString();
    query = query.gte("issued_at", iso);
  }

  if (issued_to) {
    // include entire day
    const end = new Date(issued_to);
    end.setHours(23, 59, 59, 999);
    query = query.lte("issued_at", end.toISOString());
  }

  // Sorting
  switch (sort) {
    case "issued_asc":
      query = query.order("issued_at", { ascending: true, nullsFirst: true });
      break;
    case "issued_desc":
      query = query.order("issued_at", { ascending: false, nullsFirst: true });
      break;
    case "due_asc":
      query = query.order("due_date", { ascending: true, nullsFirst: true });
      break;
    case "due_desc":
      query = query.order("due_date", { ascending: false, nullsFirst: true });
      break;
    case "amount_asc":
      query = query.order("total_amount", { ascending: true, nullsFirst: true });
      break;
    case "amount_desc":
      query = query.order("total_amount", { ascending: false, nullsFirst: true });
      break;
    default:
      query = query.order("issued_at", { ascending: false, nullsFirst: true });
  }

  // Pagination
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    // Soft-fail to keep UX working under strict RLS
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p className="mt-1 text-sm text-gray-600">
          Transparent amounts, clear status, quick receipts (when paid).
        </p>
        <div className="mt-6 rounded-xl border bg-red-50 p-4 text-sm text-red-700">
          Failed to load invoices.
        </div>
        <div className="mt-6 flex items-center gap-2">
          <Link
            href="/tenant"
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            ← Back to dashboard
          </Link>
          <Link
            href="/tenant/invoices"
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Retry
          </Link>
        </div>
      </div>
    );
  }

  const rows = (data ?? []) as InvoiceRow[];
  const total = count ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const baseParams = {
    q,
    status,
    issued_from,
    issued_to,
    sort,
    limit,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="mt-1 text-sm text-gray-600">
            Transparent amounts, clear status, quick receipts (when paid).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* NEW: Export CSV button (preserves filters) */}
          <Link
            href={qp("/api/tenant/invoices/csv", baseParams)}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Export CSV
          </Link>

          <Link
            href="/tenant"
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>

      {/* Filters */}
      <form method="get" className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-6">
        <input
          className="rounded-xl border px-3 py-2 text-sm md:col-span-2"
          type="text"
          name="q"
          placeholder="Search number or description…"
          defaultValue={q}
        />

        <select
          name="status"
          defaultValue={status}
          className="rounded-xl border px-3 py-2 text-sm"
        >
          <option value="">Any status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.toUpperCase()}
            </option>
          ))}
        </select>

        <input
          className="rounded-xl border px-3 py-2 text-sm"
          type="date"
          name="issued_from"
          defaultValue={issued_from}
          placeholder="Issued from"
        />
        <input
          className="rounded-xl border px-3 py-2 text-sm"
          type="date"
          name="issued_to"
          defaultValue={issued_to}
          placeholder="Issued to"
        />

        <select
          name="sort"
          defaultValue={sort}
          className="rounded-xl border px-3 py-2 text-sm"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 md:col-span-6">
          <select
            name="limit"
            defaultValue={String(limit)}
            className="rounded-xl border px-3 py-2 text-sm"
          >
            {["10", "20", "50"].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-xl border bg-black px-3 py-2 text-sm text-white hover:opacity-90"
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

      {/* List */}
      {rows.length === 0 ? (
        <div className="rounded-xl border p-6 text-sm text-gray-600">
          No invoices found{q || status || issued_from || issued_to ? " for your filters" : ""}.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Issued</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => {
                const badgeClass =
                  (inv.status ?? "").toLowerCase() === "paid"
                    ? "bg-emerald-100 text-emerald-800"
                    : (inv.status ?? "").toLowerCase() === "overdue"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800";

                return (
                  <tr
                    key={inv.id}
                    className="border-t hover:bg-gray-50/70"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {inv.number ?? inv.id.slice(0, 8).toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {inv.description ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${badgeClass}`}>
                        {(inv.status ?? "—").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">{fmtDate(inv.issued_at)}</td>
                    <td className="px-4 py-3">{fmtDate(inv.due_date)}</td>
                    <td className="px-4 py-3 text-right">
                      {(typeof inv.total_amount === "number"
                        ? inv.total_amount
                        : 0
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {(inv.currency ?? "PKR").toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/tenant/invoices/${inv.id}`}
                        className="rounded-xl border px-3 py-1.5 text-xs hover:bg-gray-50"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pager */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="text-gray-600">
          Page {page} of {totalPages} · {total.toLocaleString()} total
        </div>
        <div className="flex items-center gap-2">
          <Link
            aria-disabled={page <= 1}
            href={
              page <= 1
                ? qp("/tenant/invoices", { ...baseParams, page: 1 })
                : qp("/tenant/invoices", { ...baseParams, page: page - 1 })
            }
            className={`rounded-xl border px-3 py-1.5 ${
              page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-gray-50"
            }`}
          >
            ← Prev
          </Link>
          <Link
            aria-disabled={page >= totalPages}
            href={
              page >= totalPages
                ? qp("/tenant/invoices", { ...baseParams, page: totalPages })
                : qp("/tenant/invoices", { ...baseParams, page: page + 1 })
            }
            className={`rounded-xl border px-3 py-1.5 ${
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
