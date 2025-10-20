import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";
import InvoiceFilters from "./InvoiceFilters";

const Row = z.object({
  id: z.string(),
  number: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  issued_at: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  total_amount: z.preprocess((v) => (typeof v === "string" ? parseFloat(v) : v), z.number())
    .nullable()
    .optional(),
  currency: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});
type InvoiceRow = z.infer<typeof Row>;

function fmtDate(s?: string | null) {
  if (!s) return "—";
  try {
    return new Date(s).toDateString();
  } catch {
    return "—";
  }
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams?: { [k: string]: string | string[] | undefined };
}) {
  const supabase = createServerSupabase();

  const q = (searchParams?.q as string) || "";
  const status = ((searchParams?.status as string) || "all").toLowerCase();
  const from = (searchParams?.from as string) || "";
  const to = (searchParams?.to as string) || "";
  const page = Math.max(1, parseInt((searchParams?.page as string) || "1", 10) || 1);
  const pageSize = 20;
  const fromIdx = (page - 1) * pageSize;
  const toIdx = fromIdx + pageSize - 1;

  let query = supabase
    .from("invoices")
    .select(
      "id, number, status, issued_at, due_date, total_amount, currency, description",
      { count: "exact" }
    )
    .order("issued_at", { ascending: false });

  // Status filter
  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  // Date range on issued_at
  if (from) query = query.gte("issued_at", from);
  if (to) query = query.lte("issued_at", to);

  // Search on number/description (case-insensitive)
  if (q) {
    // Use OR for multiple ilike conditions
    // NOTE: ilike supports %wildcards%
    const like = `%${q}%`;
    query = query.or(
      `number.ilike.${like},description.ilike.${like}`
    );
  }

  // Pagination
  query = query.range(fromIdx, toIdx);

  const { data, error, count } = await query;

  if (error) {
    // soft-fail UI
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-4">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <p className="text-sm text-red-600">Error loading invoices: {error.message}</p>
      </div>
    );
  }

  const rows = (data || []).map((d) => Row.parse(d)) as InvoiceRow[];
  const total = count ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Invoices</h1>
          <p className="text-sm text-gray-600">
            Transparent amounts, clear status, quick receipts (when paid).
          </p>
        </div>
        <Link href="/tenant" className="text-sm underline">
          Back to dashboard
        </Link>
      </div>

      <InvoiceFilters
        initial={{ q, status, from, to }}
      />

      {rows.length === 0 ? (
        <div className="border rounded p-4 text-sm text-gray-600">
          <div className="font-medium mb-1">No invoices yet</div>
          <div>When your landlord issues an invoice, it’ll show up here with its status and due date.</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-3">Invoice</th>
                <th className="text-left py-2 pr-3">Description</th>
                <th className="text-left py-2 pr-3">Status</th>
                <th className="text-left py-2 pr-3">Issued</th>
                <th className="text-left py-2 pr-3">Due</th>
                <th className="text-left py-2 pr-3">Total</th>
                <th className="py-2 pr-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => (
                <tr key={inv.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 pr-3">
                    <Link href={`/tenant/invoices/${inv.id}`} className="underline">
                      {inv.number ?? inv.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">{inv.description ?? "—"}</td>
                  <td className="py-2 pr-3 uppercase">{String(inv.status ?? "").toUpperCase()}</td>
                  <td className="py-2 pr-3">{fmtDate(inv.issued_at)}</td>
                  <td className="py-2 pr-3">{fmtDate(inv.due_date)}</td>
                  <td className="py-2 pr-3">
                    {typeof inv.total_amount === "number" ? inv.total_amount : 0} {inv.currency ?? "PKR"}
                  </td>
                  <td className="py-2 pr-3 text-center">
                    <Link href={`/tenant/invoices/${inv.id}`} className="underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-sm">
            <div>
              Page {page} of {totalPages} · {total} total
            </div>
            <div className="flex gap-2">
              <PageLink page={page - 1} disabled={page <= 1} label="Previous" />
              <PageLink page={page + 1} disabled={page >= totalPages} label="Next" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PageLink({ page, disabled, label }: { page: number; disabled?: boolean; label: string }) {
  // This is a server component, so build an href with current searchParams except 'page'
  // We’ll reconstruct from headers’s URL; simpler approach: relative link with query string params.
  // For simplicity, we rely on the browser to keep other params via JS filters; otherwise:
  const href = page <= 0 ? "#" : `?page=${page}`;
  return (
    <a
      href={disabled ? "#" : href}
      aria-disabled={disabled}
      className={`px-3 py-1 border rounded ${disabled ? "opacity-50 pointer-events-none" : ""}`}
    >
      {label}
    </a>
  );
}
