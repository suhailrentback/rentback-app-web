// app/tenant/invoices/page.tsx
import Link from "next/link";
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

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

function fmtAmount(
  total: number | null | undefined,
  cents: number | null | undefined,
  currency: string | null | undefined
) {
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

const ALLOWED_SORT = new Set(["issued_at", "due_date", "total_amount", "number", "status"]);

export default async function TenantInvoicesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const supabase = createRouteSupabase();

  const q = (searchParams.q ?? "").trim();
  const status = (searchParams.status ?? "").trim().toLowerCase();
  const sortParam = (searchParams.sort ?? "issued_at").trim();
  const sort = ALLOWED_SORT.has(sortParam) ? sortParam : "issued_at";
  const dir = searchParams.dir === "asc" ? "asc" : "desc";

  const page = Math.max(1, Number.parseInt(String(searchParams.page ?? "1"), 10) || 1);
  const per = Math.min(50, Math.max(1, Number.parseInt(String(searchParams.per ?? "10"), 10) || 10));
  const from = (page - 1) * per;
  const to = from + per - 1;

  let query = supabase
    .from("invoices")
    .select(
      "id, number, status, issued_at, due_date, total_amount, amount_cents, currency, description",
      { count: "exact" }
    )
    .order(sort as any, { ascending: dir === "asc", nullsFirst: true })
    .range(from, to);

  if (status && ["open", "paid", "overdue", "issued", "draft", "unpaid"].includes(status)) {
    query = query.eq("status", status);
  }

  if (q) {
    query = query.or(`number.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data, error, count } = await query;

  const currentQuery = new URLSearchParams();
  if (q) currentQuery.set("q", q);
  if (status) currentQuery.set("status", status);
  if (sort) currentQuery.set("sort", sort);
  if (dir) currentQuery.set("dir", dir);
  if (page) currentQuery.set("page", String(page));
  if (per) currentQuery.set("per", String(per));

  const exportHref = `/api/tenant/invoices/export?${currentQuery.toString()}`;
  const currentUrl = `/tenant/invoices?${currentQuery.toString()}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-2 text-sm">
        <Link href="/tenant" className="text-blue-600 hover:underline">
          Back to dashboard
        </Link>
      </div>

      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="mt-1 text-sm text-gray-600">
            Transparent amounts, clear status, quick receipts (when paid).
          </p>
        </div>

        <a
          href={exportHref}
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
          title="Export current view as CSV"
        >
          Export CSV
        </a>
      </div>

      {error ? (
        <p className="mt-6 text-sm text-red-600">Failed to load invoices.</p>
      ) : !data || data.length === 0 ? (
        <div className="mt-8 rounded-xl border bg-white p-6 text-sm text-gray-600">
          <div className="font-medium text-gray-900">No invoices yet</div>
          <div className="mt-1">
            When your landlord issues an invoice, it’ll show up here with its status and due date.
          </div>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Issued</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((inv: InvoiceRow) => {
                const title = inv.number ?? inv.id.slice(0, 8).toUpperCase();
                const href = `/tenant/invoices/${inv.id}?return=${encodeURIComponent(
                  currentUrl
                )}`;
                const isPaid = String(inv.status ?? "").toLowerCase() === "paid";
                return (
                  <tr
                    key={inv.id}
                    className="border-t hover:bg-gray-50"
                    onClick={() => (window.location.href = href)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="px-4 py-3 font-medium text-blue-700 underline">
                      <Link href={href} prefetch={false}>
                        {title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{inv.description ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={isPaid ? "text-green-700" : "text-amber-700"}>
                        {(inv.status ?? "—").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">{fmtDate(inv.issued_at)}</td>
                    <td className="px-4 py-3">{fmtDate(inv.due_date)}</td>
                    <td className="px-4 py-3 text-right">
                      {fmtAmount(inv.total_amount, inv.amount_cents, inv.currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Tiny pager (unchanged behavior; just renders if count is present) */}
          {typeof count === "number" && count > per && (
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
              <div className="text-gray-600">
                Showing {(from + 1).toLocaleString()}–{Math.min(to + 1, count).toLocaleString()} of{" "}
                {count.toLocaleString()}
              </div>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/tenant/invoices?${new URLSearchParams({
                      ...Object.fromEntries(currentQuery),
                      page: String(page - 1),
                    }).toString()}`}
                    className="rounded-lg border px-3 py-1 hover:bg-gray-50"
                    prefetch={false}
                  >
                    Previous
                  </Link>
                )}
                {to + 1 < count && (
                  <Link
                    href={`/tenant/invoices?${new URLSearchParams({
                      ...Object.fromEntries(currentQuery),
                      page: String(page + 1),
                    }).toString()}`}
                    className="rounded-lg border px-3 py-1 hover:bg-gray-50"
                    prefetch={false}
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
