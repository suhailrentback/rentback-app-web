// app/tenant/invoices/page.tsx
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";

export const runtime = "nodejs";

const PageSize = 10;

// Parse and coerce search params safely (so we avoid TS/edge errors)
const SearchSchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => (Array.isArray(v) ? v : v ? [v] : [])),
  issued_from: z.string().optional(),
  issued_to: z.string().optional(),
  due_from: z.string().optional(),
  due_to: z.string().optional(),
  min_amount: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .refine((v) => v === undefined || Number.isFinite(v!), {
      message: "min_amount must be a number",
    }),
  max_amount: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .refine((v) => v === undefined || Number.isFinite(v!), {
      message: "max_amount must be a number",
    }),
  sort: z
    .enum(["issued_at", "due_date", "total_amount", "number", "status"])
    .optional()
    .default("issued_at"),
  dir: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z
    .string()
    .optional()
    .transform((v) => {
      const n = v ? Number(v) : 1;
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
    }),
});

type Row = {
  id: string;
  number: string | null;
  status: string | null;
  total_amount: number | null;
  currency: string | null;
  issued_at: string | null;
  due_date: string | null;
  description: string | null;
};

function buildQueryString(base: URLSearchParams, overrides: Record<string, string | undefined>) {
  const next = new URLSearchParams(base.toString());
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined || v === "") next.delete(k);
    else next.set(k, v);
  }
  return next.toString();
}

export default async function TenantInvoicesPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const parsed = SearchSchema.safeParse(searchParams ?? {});
  const sp = parsed.success ? parsed.data : SearchSchema.parse({}); // fallback to defaults

  const supabase = createServerSupabase();

  // Build the base query (RLS will scope to current tenant automatically)
  let query = supabase
    .from("invoices")
    .select("id, number, status, total_amount, currency, issued_at, due_date, description", {
      count: "exact",
    });

  // Text search against invoice number or description (ILIKE)
  if (sp.q && sp.q.length > 0) {
    // Use or() with ilike on both fields
    // NOTE: needs PostgREST filter syntax
    query = query.or(`number.ilike.%${sp.q}%,description.ilike.%${sp.q}%`);
  }

  // Status filter (multiple)
  if (sp.status.length > 0) {
    // Normalize allowed statuses (defensive, won’t throw)
    const allowed = new Set(["open", "issued", "paid", "overdue"]);
    const wanted = sp.status
      .map((s) => String(s).toLowerCase())
      .filter((s) => allowed.has(s));
    if (wanted.length > 0) {
      query = query.in("status", wanted);
    }
  }

  // Amount range
  if (sp.min_amount !== undefined) query = query.gte("total_amount", sp.min_amount);
  if (sp.max_amount !== undefined) query = query.lte("total_amount", sp.max_amount);

  // Date ranges
  if (sp.issued_from) query = query.gte("issued_at", sp.issued_from);
  if (sp.issued_to) query = query.lte("issued_at", sp.issued_to);
  if (sp.due_from) query = query.gte("due_date", sp.due_from);
  if (sp.due_to) query = query.lte("due_date", sp.due_to);

  // Sorting
  query = query.order(sp.sort, { ascending: sp.dir === "asc" });

  // Pagination
  const page = sp.page ?? 1;
  const from = (page - 1) * PageSize;
  const to = from + PageSize - 1;

  const { data, error, count } = await query.range(from, to);

  const invoices = (data ?? []) as Row[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PageSize));

  // Keep current query for link preservation
  const currentQS = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams ?? {})) {
    if (Array.isArray(v)) v.forEach((vv) => currentQS.append(k, String(vv)));
    else if (v !== undefined) currentQS.set(k, String(v));
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Invoices</h1>
        <p className="text-sm text-gray-500">
          Transparent amounts, clear status, quick receipts (when paid).
        </p>
      </div>

      {/* Filters (GET form, no client JS) */}
      <form method="GET" className="mb-4 grid grid-cols-1 gap-3 rounded-xl border p-4 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-600">Search</label>
          <input
            type="text"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Number or description"
            className="rounded-xl border px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-600">Status</label>
          <div className="flex flex-wrap gap-2">
            {["open", "issued", "paid", "overdue"].map((s) => {
              const checked = sp.status.includes(s);
              return (
                <label key={s} className="flex items-center gap-2 rounded-xl border px-2 py-1 text-sm">
                  <input type="checkbox" name="status" value={s} defaultChecked={checked} />
                  {s.toUpperCase()}
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-600">Issued from</label>
          <input type="date" name="issued_from" defaultValue={sp.issued_from ?? ""} className="rounded-xl border px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-600">Issued to</label>
          <input type="date" name="issued_to" defaultValue={sp.issued_to ?? ""} className="rounded-xl border px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-600">Due from</label>
          <input type="date" name="due_from" defaultValue={sp.due_from ?? ""} className="rounded-xl border px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-600">Due to</label>
          <input type="date" name="due_to" defaultValue={sp.due_to ?? ""} className="rounded-xl border px-3 py-2 text-sm" />
        </div>

        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Min amount</label>
            <input type="number" name="min_amount" defaultValue={sp.min_amount ?? ""} className="w-40 rounded-xl border px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Max amount</label>
            <input type="number" name="max_amount" defaultValue={sp.max_amount ?? ""} className="w-40 rounded-xl border px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Sort by</label>
            <select name="sort" defaultValue={sp.sort} className="w-44 rounded-xl border px-3 py-2 text-sm">
              <option value="issued_at">Issued date</option>
              <option value="due_date">Due date</option>
              <option value="total_amount">Amount</option>
              <option value="number">Invoice #</option>
              <option value="status">Status</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Direction</label>
            <select name="dir" defaultValue={sp.dir} className="w-28 rounded-xl border px-3 py-2 text-sm">
              <option value="desc">DESC</option>
              <option value="asc">ASC</option>
            </select>
          </div>
        </div>

        {/* Preserve page reset to 1 on submit */}
        <input type="hidden" name="page" value="1" />

        <div className="flex items-end gap-2">
          <button className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50" type="submit">
            Apply filters
          </button>
          <Link href="/tenant/invoices" className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">
            Reset
          </Link>
        </div>
      </form>

      {/* Results */}
      {error ? (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          Failed to load invoices. Try again.
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded-xl border p-6 text-sm text-gray-600">
          No invoices yet. When your landlord issues an invoice, it will show up here.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const isPaid = String(inv.status ?? "").toLowerCase() === "paid";
                const rowLink = `/tenant/invoices/${inv.id}`;
                return (
                  <tr key={inv.id} className="border-t">
                    <td className="px-4 py-3">
                      <span className="font-medium">{inv.number ?? inv.id.slice(0, 8)}</span>
                      <div className="text-xs text-gray-500 line-clamp-1">{inv.description ?? ""}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "rounded-full px-2 py-1 text-xs " +
                          (isPaid
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700")
                        }
                      >
                        {(inv.status ?? "").toUpperCase() || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {typeof inv.total_amount === "number"
                        ? `${inv.total_amount} ${inv.currency ?? "PKR"}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {inv.due_date ? new Date(inv.due_date).toDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={rowLink}
                        className="rounded-xl border px-2 py-1 hover:bg-gray-50"
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

      {/* Pager (preserve active filters/sort) */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="text-gray-600">
          Page {page} of {totalPages} · {total} total
        </div>
        <div className="flex items-center gap-2">
          {page > 1 && (
            <Link
              href={`?${buildQueryString(currentQS, { page: String(page - 1) })}`}
              className="rounded-xl border px-3 py-2 hover:bg-gray-50"
            >
              Previous
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={`?${buildQueryString(currentQS, { page: String(page + 1) })}`}
              className="rounded-xl border px-3 py-2 hover:bg-gray-50"
            >
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
