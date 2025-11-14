// app/tenant/invoices/page.tsx
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Invoice = {
  id: string;
  number: string | null;
  amount_cents: number | null;
  currency: string | null;
  status: string | null; // open | issued | overdue | paid
  due_date: string | null; // YYYY-MM-DD
  created_at: string;
};

function fmtAmt(cents?: number | null, ccy?: string | null) {
  const v = ((Number(cents || 0)) / 100).toFixed(2);
  return `${v} ${ccy || ""}`.trim();
}

function keep(params: Record<string, string | string[] | undefined>, patch: Record<string, string>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (typeof v === "string") usp.set(k, v);
    if (Array.isArray(v)) v.forEach((x) => usp.append(k, x));
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v === "") usp.delete(k);
    else usp.set(k, v);
  }
  return `?${usp.toString()}`;
}

export default async function TenantInvoicesPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const jar = cookies();
  const sb = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { get: (name: string) => jar.get(name)?.value },
  });

  const { data: auth } = await sb.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) redirect("/not-permitted");

  // Soft role check; RLS still enforces
  const { data: me } = await sb.from("profiles").select("role").eq("user_id", uid).maybeSingle();
  if (!me) redirect("/not-permitted");

  // Filters/sort/paging
  const q = (searchParams?.q as string) || ""; // search by invoice number
  const status = (searchParams?.status as string) || ""; // open/issued/overdue/paid
  const sort = (searchParams?.sort as string) || "due_desc"; // due_desc | due_asc | created_desc | created_asc
  const page = Math.max(1, parseInt(((searchParams?.page as string) || "1"), 10) || 1);
  const limit = 20;
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  let query = sb
    .from("invoices")
    .select("id, number, amount_cents, currency, status, due_date, created_at")
    .eq("tenant_id", uid);

  if (q) query = query.ilike("number", `%${q}%`);
  if (status) query = query.eq("status", status);

  // sort
  switch (sort) {
    case "due_asc":
      query = query.order("due_date", { ascending: true, nullsFirst: false });
      break;
    case "created_asc":
      query = query.order("created_at", { ascending: true, nullsFirst: false });
      break;
    case "created_desc":
      query = query.order("created_at", { ascending: false, nullsFirst: false });
      break;
    case "due_desc":
    default:
      query = query.order("due_date", { ascending: false, nullsFirst: false });
  }

  const { data, error } = await query.range(start, end);
  if (error) {
    return (
      <div className="mx-auto w-full max-w-4xl p-4 md:p-6">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">My Invoices</h1>
          <Link href="/tenant" className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
            ← Tenant home
          </Link>
        </div>
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">Failed to load: {error.message}</p>
      </div>
    );
  }

  const rows = (data || []) as Invoice[];
  const hasNext = rows.length === limit;
  const hasPrev = page > 1;

  return (
    <div className="mx-auto w-full max-w-4xl p-4 md:p-6">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Invoices</h1>
        <Link href="/tenant" className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
          ← Tenant home
        </Link>
      </div>

      {/* Filters */}
      <form className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        <input
          name="q"
          placeholder="Search invoice #"
          defaultValue={q}
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <select name="status" defaultValue={status} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">Any status</option>
          <option value="open">Open</option>
          <option value="issued">Issued</option>
          <option value="overdue">Overdue</option>
          <option value="paid">Paid</option>
        </select>
        <select name="sort" defaultValue={sort} className="rounded-lg border px-3 py-2 text-sm">
          <option value="due_desc">Due date (newest)</option>
          <option value="due_asc">Due date (oldest)</option>
          <option value="created_desc">Created (newest)</option>
          <option value="created_asc">Created (oldest)</option>
        </select>
        <div>
          <button className="w-full rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">Apply</button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="border px-2 py-1 text-left">Number</th>
              <th className="border px-2 py-1 text-left">Due date</th>
              <th className="border px-2 py-1 text-left">Amount</th>
              <th className="border px-2 py-1 text-left">Status</th>
              <th className="border px-2 py-1 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((inv) => (
              <tr key={inv.id}>
                <td className="border px-2 py-1">{inv.number || "—"}</td>
                <td className="border px-2 py-1">{inv.due_date || "—"}</td>
                <td className="border px-2 py-1">{fmtAmt(inv.amount_cents, inv.currency)}</td>
                <td className="border px-2 py-1">{inv.status || "—"}</td>
                <td className="border px-2 py-1">
                  <Link className="text-blue-600 underline" href={`/tenant/invoices/${inv.id}`}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td className="border px-2 py-4 text-center" colSpan={5}>
                  No invoices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pager */}
      <div className="mt-4 flex items-center justify-between">
        <Link
          href={keep(searchParams || {}, { page: String(Math.max(1, page - 1)) })}
          className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
          aria-disabled={!hasPrev}
          onClick={(e) => { if (!hasPrev) e.preventDefault(); }}
        >
          ← Prev
        </Link>
        <span className="text-sm text-gray-600">Page {page}</span>
        <Link
          href={keep(searchParams || {}, { page: String(page + 1) })}
          className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
          aria-disabled={!hasNext}
          onClick={(e) => { if (!hasNext) e.preventDefault(); }}
        >
          Next →
        </Link>
      </div>
    </div>
  );
}
