// app/tenant/invoices/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const Invoice = z.object({
  id: z.string(),
  number: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  issued_at: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  total_amount: z
    .preprocess((v) => (typeof v === "string" ? Number(v) : v), z.number())
    .nullable()
    .optional(),
  currency: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});
type InvoiceRow = z.infer<typeof Invoice>;

function formatMoney(v: number | null | undefined, ccy?: string | null) {
  if (typeof v !== "number" || Number.isNaN(v)) return "—";
  const c = (ccy ?? "PKR").toUpperCase();
  return `${v} ${c}`;
}

function buildQueryString(
  params: Record<string, string | undefined | null>
): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v).length > 0) sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export default async function TenantInvoicesPage({
  searchParams,
}: {
  searchParams?: {
    q?: string;
    status?: string;
    issued_from?: string;
    issued_to?: string;
    due_from?: string;
    due_to?: string;
    min?: string; // min total_amount
    max?: string; // max total_amount
    page?: string;
    pageSize?: string;
  };
}) {
  const supabase = createServerSupabase();

  // Auth & role gate
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) notFound();

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!me || String(me.role) !== "tenant") notFound();

  // Read filters
  const q = (searchParams?.q ?? "").trim();
  const status = (searchParams?.status ?? "").trim().toLowerCase();
  const issued_from = searchParams?.issued_from?.trim();
  const issued_to = searchParams?.issued_to?.trim();
  const due_from = searchParams?.due_from?.trim();
  const due_to = searchParams?.due_to?.trim();
  const min = Number(searchParams?.min);
  const max = Number(searchParams?.max);

  // Pagination (safe bounds)
  const page = Math.max(1, parseInt(searchParams?.page ?? "1", 10) || 1);
  const pageSize = Math.min(
    50,
    Math.max(5, parseInt(searchParams?.pageSize ?? "10", 10) || 10)
  );
  const start = (page - 1) * pageSize;
  const end = start + pageSize; // fetch one extra row to detect "hasNext"

  // Build query with optional filters (server-side)
  let query = supabase
    .from("invoices")
    .select(
      "id, number, status, issued_at, due_date, total_amount, currency, description"
    )
    .eq("tenant_id", user.id);

  if (status && ["open", "paid", "void"].includes(status)) {
    query = query.eq("status", status);
  }

  if (q) {
    const like = `%${q}%`;
    query = query.or(`number.ilike.${like},description.ilike.${like}`);
  }

  if (issued_from) query = query.gte("issued_at", new Date(issued_from).toISOString());
  if (issued_to) query = query.lte("issued_at", new Date(issued_to).toISOString());
  if (due_from) query = query.gte("due_date", new Date(due_from).toISOString());
  if (due_to) query = query.lte("due_date", new Date(due_to).toISOString());
  if (!Number.isNaN(min)) query = query.gte("total_amount", min);
  if (!Number.isNaN(max)) query = query.lte("total_amount", max);

  // Stable order, then range
  query = query.order("issued_at", { ascending: false }).range(start, end);

  const { data, error } = await query;
  const parsed = Invoice.array().safeParse(data ?? []);
  const rows: InvoiceRow[] = parsed.success ? parsed.data : [];
  const hasNext = rows.length > pageSize;
  const invoices = rows.slice(0, pageSize);
  const hasPrev = page > 1;

  // Helper to preserve filters across page nav
  const baseParams = {
    q,
    status,
    issued_from,
    issued_to,
    due_from,
    due_to,
    min: Number.isNaN(min) ? undefined : String(min),
    max: Number.isNaN(max) ? undefined : String(max),
    pageSize: String(pageSize),
  };

  const prevHref = hasPrev
    ? buildQueryString({ ...baseParams, page: String(page - 1) })
    : "";
  const nextHref = hasNext
    ? buildQueryString({ ...baseParams, page: String(page + 1) })
    : "";

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-4">
        <Link href="/tenant" className="text-sm text-blue-600 hover:underline">
          ← Back to dashboard
        </Link>
      </div>

      <h1 className="text-2xl font-semibold">Invoices</h1>
      <p className="mt-1 text-sm text-gray-600">
        Transparent amounts, clear status, quick receipts (when paid).
      </p>

      {/* Filters */}
      <form className="mt-6 rounded-lg border bg-white p-4 shadow-sm" method="get">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium" htmlFor="q">
              Search (number or description)
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="e.g., INV-2025-001 or October rent"
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={status}
              className="mt-1 w-full rounded-md border px-3 py-2"
            >
              <option value="">Any</option>
              <option value="open">Open</option>
              <option value="paid">Paid</option>
              <option value="void">Void</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium" htmlFor="min">
                Min amount
              </label>
              <input
                id="min"
                name="min"
                type="number"
                step="1"
                min="0"
                defaultValue={Number.isNaN(min) ? "" : String(min)}
                className="mt-1 w-full rounded-md border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="max">
                Max amount
              </label>
              <input
                id="max"
                name="max"
                type="number"
                step="1"
                min="0"
                defaultValue={Number.isNaN(max) ? "" : String(max)}
                className="mt-1 w-full rounded-md border px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium" htmlFor="issued_from">
              Issued from
            </label>
            <input
              id="issued_from"
              name="issued_from"
              type="date"
              defaultValue={issued_from}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="issued_to">
              Issued to
            </label>
            <input
              id="issued_to"
              name="issued_to"
              type="date"
              defaultValue={issued_to}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium" htmlFor="due_from">
              Due from
            </label>
            <input
              id="due_from"
              name="due_from"
              type="date"
              defaultValue={due_from}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="due_to">
              Due to
            </label>
            <input
              id="due_to"
              name="due_to"
              type="date"
              defaultValue={due_to}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>

          {/* Optional pageSize control (kept minimal) */}
          <div>
            <label className="block text-sm font-medium" htmlFor="pageSize">
              Page size
            </label>
            <select
              id="pageSize"
              name="pageSize"
              defaultValue={String(pageSize)}
              className="mt-1 w-full rounded-md border px-3 py-2"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Apply
          </button>
          <Link
            href="/tenant/invoices"
            className="rounded-md border px-4 py-2 hover:bg-gray-50"
          >
            Reset
          </Link>
        </div>
      </form>

      {/* List */}
      <div className="mt-6 overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Invoice #</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Issued</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-600">
                  <div className="mb-1 text-base font-medium">No invoices found</div>
                  <div className="text-xs">Adjust filters or clear them to see everything.</div>
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const issued = inv.issued_at
                  ? new Date(inv.issued_at).toDateString()
                  : "—";
                const due = inv.due_date
                  ? new Date(inv.due_date).toDateString()
                  : "—";
                return (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/tenant/invoices/${inv.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {inv.number ?? inv.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{inv.description ?? "—"}</td>
                    <td className="px-4 py-3 uppercase">
                      {(inv.status ?? "").toString()}
                    </td>
                    <td className="px-4 py-3">{issued}</td>
                    <td className="px-4 py-3">{due}</td>
                    <td className="px-4 py-3">
                      {formatMoney(
                        typeof inv.total_amount === "number" ? inv.total_amount : null,
                        inv.currency
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/tenant/invoices/${inv.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        View →
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
        <div className="text-sm text-gray-600">Page {page}</div>
        <div className="flex gap-2">
          <Link
            aria-disabled={!hasPrev}
            href={hasPrev ? prevHref || "/tenant/invoices" : "#"}
            className={`rounded-md border px-3 py-2 text-sm ${
              hasPrev ? "hover:bg-gray-50" : "pointer-events-none opacity-50"
            }`}
          >
            ← Previous
          </Link>
          <Link
            aria-disabled={!hasNext}
            href={hasNext ? nextHref || "/tenant/invoices" : "#"}
            className={`rounded-md border px-3 py-2 text-sm ${
              hasNext ? "hover:bg-gray-50" : "pointer-events-none opacity-50"
            }`}
          >
            Next →
          </Link>
        </div>
      </div>
    </main>
  );
}
