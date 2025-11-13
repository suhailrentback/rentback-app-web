// app/tenant/payments/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function supabaseFromCookies() {
  const jar = cookies();
  return createServerClient(URL, ANON, {
    cookies: { get: (n: string) => jar.get(n)?.value },
  });
}

function preserve(base: string, params: URLSearchParams, patch: Record<string, string | number>) {
  const q = new URLSearchParams(params);
  Object.entries(patch).forEach(([k, v]) => (v === "" ? q.delete(k) : q.set(k, String(v))));
  const qs = q.toString();
  return qs ? `${base}?${qs}` : base;
}

function fmt(cents: any, currency: any) {
  const n = typeof cents === "number" ? cents : Number(cents ?? 0);
  return `${(n / 100).toFixed(2)} ${String(currency ?? "PKR").toUpperCase()}`;
}

export default async function TenantPaymentsPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams || {})) if (typeof v === "string") sp.set(k, v);

  const status = sp.get("status") || "all";
  const sort = sp.get("sort") || "created_desc"; // created_desc|created_asc|amount_desc|amount_asc|status_asc|status_desc
  const q = sp.get("q") || "";
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
  const per = 20;

  const sb = supabaseFromCookies();

  // auth + role
  const { data: me } = await sb.auth.getUser();
  if (!me?.user?.id) notFound();
  const { data: prof } = await sb.from("profiles").select("role").eq("user_id", me.user.id).maybeSingle();
  if (!prof || String(prof.role) !== "tenant") notFound();

  // build query
  let query = sb
    .from("payments")
    .select("id, amount_cents, currency, status, reference, created_at, confirmed_at, invoice_id, invoice:invoices ( id, number, due_date )")
    .eq("tenant_id", me.user.id);

  if (status !== "all") query = query.eq("status", status);
  if (q) query = query.ilike("reference", `%${q}%`);

  const [by, asc] = (() => {
    switch (sort) {
      case "created_asc": return ["created_at", true] as const;
      case "amount_desc": return ["amount_cents", false] as const;
      case "amount_asc": return ["amount_cents", true] as const;
      case "status_asc": return ["status", true] as const;
      case "status_desc": return ["status", false] as const;
      case "created_desc":
      default: return ["created_at", false] as const;
    }
  })();

  query = query.order(by, { ascending: asc });

  // pagination
  const from = (page - 1) * per;
  const to = from + per;
  const { data, error } = await query.range(from, to);

  const rows = Array.isArray(data) ? data : [];
  const hasNext = rows.length > per;
  const visible = hasNext ? rows.slice(0, per) : rows;

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">My payments</h1>
        <Link href="/tenant" className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">Back to tenant</Link>
      </div>

      {/* controls */}
      <form className="mb-3 flex flex-wrap items-center gap-2 text-sm" action="/tenant/payments" method="get">
        <input name="q" defaultValue={q} placeholder="Search reference" className="min-w-[220px] rounded-xl border px-3 py-2" />
        <select name="status" defaultValue={status} className="rounded-xl border px-3 py-2">
          {["all","pending","confirmed","failed"].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
        </select>
        <select name="sort" defaultValue={sort} className="rounded-xl border px-3 py-2">
          <option value="created_desc">Date ↓</option>
          <option value="created_asc">Date ↑</option>
          <option value="amount_desc">Amount ↓</option>
          <option value="amount_asc">Amount ↑</option>
          <option value="status_desc">Status ↓</option>
          <option value="status_asc">Status ↑</option>
        </select>
        <button className="rounded-xl border px-3 py-2 hover:bg-gray-50">Apply</button>
      </form>

      <div className="overflow-hidden rounded-2xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Reference</th>
              <th className="px-3 py-2 font-medium">Invoice</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={5}>{error ? "Could not load payments." : "No payments yet"}</td></tr>
            )}
            {visible.map((r: any) => {
              const created = r?.created_at ? new Date(r.created_at).toDateString() : "-";
              const inv = Array.isArray(r?.invoice) ? r.invoice[0] : r?.invoice;
              const invoiceLink = inv?.id ? `/tenant/invoices/${inv.id}` : null;
              return (
                <tr key={String(r.id)} className="border-t">
                  <td className="px-3 py-2">{created}</td>
                  <td className="px-3 py-2">{r?.reference ?? "-"}</td>
                  <td className="px-3 py-2">
                    {invoiceLink ? <Link className="underline" href={invoiceLink}>{inv?.number ?? inv?.id ?? "View"}</Link> : <span className="text-gray-500">—</span>}
                  </td>
                  <td className="px-3 py-2">{String(r?.status ?? "-").toUpperCase()}</td>
                  <td className="px-3 py-2 text-right">{fmt(r?.amount_cents, r?.currency)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* pager */}
      <div className="mt-3 flex items-center justify-between text-sm">
        <Link
          aria-disabled={page <= 1}
          className={`rounded-xl border px-3 py-2 ${page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-gray-50"}`}
          href={preserve("/tenant/payments", sp, { page: Math.max(1, page - 1) })}
        >
          ← Prev
        </Link>
        <span>Page {page}</span>
        <Link
          aria-disabled={!hasNext}
          className={`rounded-xl border px-3 py-2 ${!hasNext ? "pointer-events-none opacity-50" : "hover:bg-gray-50"}`}
          href={preserve("/tenant/payments", sp, { page: page + 1 })}
        >
          Next →
        </Link>
      </div>
    </div>
  );
}
