// app/tenant/invoices/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Raw = {
  id: string;
  number: string | null;
  description: string | null;
  status: string | null;
  amount_cents: number | null;
  currency: string | null;
  due_date: string | null;
  created_at: string | null;
};

type Row = {
  id: string;
  number: string;
  description: string | null;
  status: string;
  amountCents: number;
  currency: string;
  dueDate: string | null;
  createdAt: string | null;
};

function fmtAmt(cents?: number | null, ccy?: string | null) {
  const v = ((Number(cents || 0)) / 100).toFixed(2);
  return `${v} ${ccy || ""}`.trim();
}

function badge(status: string) {
  const s = (status || "").toLowerCase();
  const cls =
    s === "paid"
      ? "bg-green-100 text-green-700"
      : s === "open"
      ? "bg-yellow-100 text-yellow-800"
      : s === "overdue"
      ? "bg-red-100 text-red-700"
      : "bg-gray-100 text-gray-700";
  const label = s ? s[0].toUpperCase() + s.slice(1) : "—";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

function qparams(base: Record<string, string | number | undefined>, overrides: Record<string, string | number | undefined>) {
  const merged = { ...base, ...overrides };
  const sp = new URLSearchParams();
  Object.entries(merged).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== null) sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

async function fetchRows(search: {
  tenantId: string;
  q?: string;
  status?: string;
  sort?: string;
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}) {
  const jar = cookies();
  const sb = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { get: (n: string) => jar.get(n)?.value },
  });

  const page = Math.max(1, Number(search.page || 1));
  const pageSize = Math.min(50, Math.max(5, Number(search.pageSize || 10)));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = sb
    .from("invoices")
    .select("id,number,description,status,amount_cents,currency,due_date,created_at", { count: "exact" })
    .eq("tenant_id", search.tenantId);

  const q = (search.q || "").trim();
  if (q) {
    // number OR description ilike
    query = query.or(`number.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const st = (search.status || "").toUpperCase();
  if (st && st !== "ALL") {
    query = query.eq("status", st);
  }

  const sort = (search.sort || "due_date") as "due_date" | "created_at" | "amount_cents";
  const dir = (search.dir || "desc") as "asc" | "desc";
  query = query.order(sort, { ascending: dir === "asc" });

  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) return { rows: [] as Row[], count: 0, page, pageSize };

  const raw: Raw[] = Array.isArray(data) ? ((data as unknown) as Raw[]) : [];
  const rows: Row[] = raw.map((r) => ({
    id: r.id,
    number: r.number || "(no number)",
    description: r.description || null,
    status: r.status || "OPEN",
    amountCents: Number(r.amount_cents || 0),
    currency: r.currency || "PKR",
    dueDate: r.due_date || null,
    createdAt: r.created_at || null,
  }));
  return { rows, count: count || 0, page, pageSize };
}

export default async function TenantInvoicesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const jar = cookies();
  const sb = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { get: (n: string) => jar.get(n)?.value },
  });

  const { data: auth } = await sb.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p>Please sign in.</p>
      </div>
    );
  }

  const q = (searchParams.q as string) || "";
  const status = (searchParams.status as string) || "ALL";
  const sort = (searchParams.sort as string) || "due_date";
  const dir = ((searchParams.dir as string) || "desc") as "asc" | "desc";
  const page = Number(searchParams.page || 1);
  const baseQP = { q, status, sort, dir, page };

  const { rows, count, pageSize } = await fetchRows({
    tenantId: uid,
    q,
    status,
    sort,
    dir,
    page,
    pageSize: 10,
  });

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <h1 className="text-xl font-semibold">My Invoices</h1>
        <form method="GET" className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col">
            <label className="mb-1 text-xs text-gray-600">Search</label>
            <input
              name="q"
              defaultValue={q}
              placeholder="Number or description"
              className="rounded border px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-xs text-gray-600">Status</label>
            <select name="status" defaultValue={status} className="rounded border px-2 py-1.5 text-sm">
              <option value="ALL">All</option>
              <option value="OPEN">Open</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-xs text-gray-600">Sort</label>
            <select name="sort" defaultValue={sort} className="rounded border px-2 py-1.5 text-sm">
              <option value="due_date">Due date</option>
              <option value="created_at">Created</option>
              <option value="amount_cents">Amount</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-xs text-gray-600">Dir</label>
            <select name="dir" defaultValue={dir} className="rounded border px-2 py-1.5 text-sm">
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
          <button className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50" type="submit">
            Apply
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
            <tr>
              <th className="px-3 py-2">Invoice</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Due</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                  No invoices found.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-3 py-2">
                  <div className="font-medium">{r.number}</div>
                  <div className="text-xs text-gray-500">{r.description || "\u00A0"}</div>
                </td>
                <td className="px-3 py-2">{fmtAmt(r.amountCents, r.currency)}</td>
                <td className="px-3 py-2">{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "—"}</td>
                <td className="px-3 py-2">{badge(r.status)}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <Link
                      href={`/tenant/invoices/${r.id}`}
                      className="rounded border px-2 py-1"
                      prefetch={false}
                    >
                      View
                    </Link>
                    <a
                      className="rounded border px-2 py-1"
                      href={`/api/tenant/invoices/${r.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download PDF
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pager */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Page {baseQP.page} of {totalPages} ({count} total)
        </div>
        <div className="flex gap-2">
          <Link
            className="rounded border px-3 py-1.5 text-sm disabled:opacity-50"
            href={qparams(baseQP, { page: Math.max(1, Number(baseQP.page) - 1) })}
            aria-disabled={Number(baseQP.page) <= 1}
          >
            ← Prev
          </Link>
          <Link
            className="rounded border px-3 py-1.5 text-sm disabled:opacity-50"
            href={qparams(baseQP, { page: Math.min(totalPages, Number(baseQP.page) + 1) })}
            aria-disabled={Number(baseQP.page) >= totalPages}
          >
            Next →
          </Link>
        </div>
      </div>
    </div>
  );
}
