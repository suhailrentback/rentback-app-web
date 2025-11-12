// app/tenant/payments/page.tsx
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const PAGE_SIZE = 20;

type SearchParams = { [key: string]: string | string[] | undefined };

type PaymentDbRow = {
  id: string;
  tenant_id: string | null;
  invoice_id: string | null;
  amount_cents: number;
  currency: string;
  status: "pending" | "confirmed" | string;
  reference: string | null;
  created_at: string;
  confirmed_at: string | null;
};

type InvoiceLite = {
  id: string;
  number: string | null;
  due_date: string | null;
};

type PaymentRow = {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  reference: string | null;
  created_at: string;
  confirmed_at: string | null;
  invoice?: InvoiceLite | null;
};

function fmtMoney(cents: number, currency: string) {
  const amount = (cents ?? 0) / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function toISODateOrUndefined(v?: string | string[]) {
  if (!v) return undefined;
  const s = Array.isArray(v) ? v[0] : v;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

function keepParams(base: string, params: URLSearchParams, overrides: Record<string, string | null>) {
  const next = new URLSearchParams(params);
  for (const [k, v] of Object.entries(overrides)) {
    if (v === null || v === "") next.delete(k);
    else next.set(k, v);
  }
  const q = next.toString();
  return q ? `${base}?${q}` : base;
}

async function fetchPayments(searchParams: SearchParams): Promise<{ rows: PaymentRow[]; hasNext: boolean; page: number }> {
  const cookieStore = cookies();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });

  // Parse filters/sort/pager
  const status = (Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status) || "all";
  const q = (Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q) || "";
  const sort = (Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort) || "date_desc";
  const page = Math.max(1, parseInt((Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page) || "1", 10));

  const createdFromISO = toISODateOrUndefined(searchParams.from as string | undefined);
  // If "to" was provided as a date (yyyy-mm-dd), include that full day by bumping to 23:59:59
  let createdToISO: string | undefined;
  if (searchParams.to) {
    const raw = Array.isArray(searchParams.to) ? searchParams.to[0] : searchParams.to;
    const d = new Date(raw as string);
    if (!isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      createdToISO = d.toISOString();
    }
  }

  // Build query
  let query = supabase
    .from("payments")
    .select(
      "id, tenant_id, invoice_id, amount_cents, currency, status, reference, created_at, confirmed_at",
      { count: "exact" }
    );

  if (status === "confirmed") query = query.eq("status", "confirmed");
  if (status === "pending") query = query.eq("status", "pending");
  if (createdFromISO) query = query.gte("created_at", createdFromISO);
  if (createdToISO) query = query.lte("created_at", createdToISO);
  if (q) query = query.ilike("reference", `%${q}%`);

  // Sorting
  if (sort === "date_asc") query = query.order("created_at", { ascending: true });
  else if (sort === "amount_asc") query = query.order("amount_cents", { ascending: true });
  else if (sort === "amount_desc") query = query.order("amount_cents", { ascending: false });
  else query = query.order("created_at", { ascending: false }); // date_desc default

  // Pager: fetch one extra to detect next page
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE; // one extra
  query = query.range(from, to);

  const { data, error } = await query;
  if (error) {
    // If RLS forbids or error occurs, return empty list (page handles the message)
    return { rows: [], hasNext: false, page };
  }

  const rowsDb = (data ?? []) as unknown as PaymentDbRow[];

  // Collect invoice ids for a second fetch
  const invIds = Array.from(new Set(rowsDb.map(r => r.invoice_id).filter(Boolean))) as string[];
  let invMap = new Map<string, InvoiceLite>();
  if (invIds.length > 0) {
    const { data: invs, error: invErr } = await supabase
      .from("invoices")
      .select("id, number, due_date")
      .in("id", invIds);

    if (!invErr && invs) {
      for (const inv of invs as any[]) {
        invMap.set(String(inv.id), {
          id: String(inv.id),
          number: inv.number ?? null,
          due_date: inv.due_date ?? null,
        });
      }
    }
  }

  // Map to display rows and slice to PAGE_SIZE
  const rows: PaymentRow[] = rowsDb.slice(0, PAGE_SIZE).map((r) => ({
    id: String(r.id),
    amount_cents: Number(r.amount_cents ?? 0),
    currency: String(r.currency ?? "PKR"),
    status: String(r.status ?? ""),
    reference: r.reference ?? null,
    created_at: String(r.created_at),
    confirmed_at: r.confirmed_at ? String(r.confirmed_at) : null,
    invoice: r.invoice_id ? invMap.get(r.invoice_id) ?? null : null,
  }));

  const hasNext = rowsDb.length > PAGE_SIZE;
  return { rows, hasNext, page };
}

export default async function TenantPaymentsPage({ searchParams }: { searchParams: SearchParams }) {
  const { rows, hasNext, page } = await fetchPayments(searchParams);

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (Array.isArray(v)) params.set(k, v[0] ?? "");
    else if (v) params.set(k, v);
  }

  const prevHref = page > 1 ? keepParams("/tenant/payments", params, { page: String(page - 1) }) : "#";
  const nextHref = hasNext ? keepParams("/tenant/payments", params, { page: String(page + 1) }) : "#";

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">My payments</h1>
        <Link href="/tenant/invoices" className="text-sm underline hover:no-underline">
          View my invoices →
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className="mb-4 grid grid-cols-1 gap-2 rounded-xl border p-3 md:grid-cols-6">
        {/* status */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium">Status</label>
          <select
            name="status"
            defaultValue={(Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status) || "all"}
            className="mt-1 w-full rounded-lg border px-2 py-1 text-sm"
          >
            <option value="all">All</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* from */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium">From (date)</label>
          <input
            type="date"
            name="from"
            defaultValue={(Array.isArray(searchParams.from) ? searchParams.from[0] : (searchParams.from as string)) || ""}
            className="mt-1 w-full rounded-lg border px-2 py-1 text-sm"
          />
        </div>

        {/* to */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium">To (date)</label>
          <input
            type="date"
            name="to"
            defaultValue={(Array.isArray(searchParams.to) ? searchParams.to[0] : (searchParams.to as string)) || ""}
            className="mt-1 w-full rounded-lg border px-2 py-1 text-sm"
          />
        </div>

        {/* q */}
        <div className="md:col-span-3">
          <label className="block text-xs font-medium">Search (reference)</label>
          <input
            type="text"
            name="q"
            placeholder="e.g. bank reference"
            defaultValue={(Array.isArray(searchParams.q) ? searchParams.q[0] : (searchParams.q as string)) || ""}
            className="mt-1 w-full rounded-lg border px-2 py-1 text-sm"
          />
        </div>

        {/* sort */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium">Sort</label>
          <select
            name="sort"
            defaultValue={(Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort) || "date_desc"}
            className="mt-1 w-full rounded-lg border px-2 py-1 text-sm"
          >
            <option value="date_desc">Newest first</option>
            <option value="date_asc">Oldest first</option>
            <option value="amount_desc">Amount high → low</option>
            <option value="amount_asc">Amount low → high</option>
          </select>
        </div>

        {/* submit */}
        <div className="md:col-span-1 flex items-end">
          <button className="w-full rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">Apply</button>
        </div>
      </form>

      {/* Empty state */}
      {rows.length === 0 ? (
        <div className="rounded-xl border p-6 text-sm">
          <div className="font-medium">No payments yet</div>
          <div className="mt-1 text-gray-600">
            When you record a payment (or your landlord confirms one), it’ll appear here.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((p) => {
            const isConfirmed = String(p.status).toLowerCase() === "confirmed";
            const invLink = p.invoice?.id ? `/tenant/invoices/${p.invoice.id}` : undefined;
            return (
              <div key={p.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm">
                    <div className="font-medium">
                      {fmtMoney(p.amount_cents, p.currency)}
                      {p.invoice?.number ? (
                        <>
                          {" "}
                          · Invoice{" "}
                          {invLink ? (
                            <Link className="underline hover:no-underline" href={invLink}>
                              {p.invoice.number}
                            </Link>
                          ) : (
                            p.invoice.number
                          )}
                        </>
                      ) : null}
                    </div>
                    <div className="text-gray-600">
                      {new Date(p.created_at).toDateString()}
                      {p.reference ? <> · Ref: {p.reference}</> : null}
                    </div>
                  </div>
                  <div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        isConfirmed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {isConfirmed ? "Confirmed" : "Pending"}
                    </span>
                  </div>
                </div>
                {isConfirmed && p.confirmed_at ? (
                  <div className="mt-1 text-xs text-gray-600">
                    Confirmed on {new Date(p.confirmed_at).toDateString()}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* Pager */}
      <div className="mt-4 flex items-center justify-between">
        <Link
          href={prevHref}
          aria-disabled={page <= 1}
          className={`rounded-xl border px-3 py-2 text-sm ${page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-gray-50"}`}
        >
          ← Prev
        </Link>
        <div className="text-xs text-gray-600">Page {page}</div>
        <Link
          href={nextHref}
          aria-disabled={!hasNext}
          className={`rounded-xl border px-3 py-2 text-sm ${!hasNext ? "pointer-events-none opacity-50" : "hover:bg-gray-50"}`}
        >
          Next →
        </Link>
      </div>
    </div>
  );
}
