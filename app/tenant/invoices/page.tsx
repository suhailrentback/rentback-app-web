// app/tenant/invoices/page.tsx
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

export default async function TenantInvoicesPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams || {})) if (typeof v === "string") sp.set(k, v);

  const status = sp.get("status") || "all";
  const sort = sp.get("sort") || "issued_desc"; // issued_desc | issued_asc | due_desc | due_asc | amount_desc | amount_asc
  const q = sp.get("q") || "";
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
  const per = 20;

  const sb = supabaseFromCookies();

  // auth + role
  const { data: me } = await sb.auth.getUser();
  if (!me?.user?.id) notFound();

  const { data: prof } = await sb.from("profiles").select("role").eq("user_id", me.user.id).maybeSingle();
  if (!prof || String(prof.role) !== "tenant") notFound();

  // Build query
  let query = sb
    .from("invoices")
    .select("id, number, status, issued_at, due_date, total_amount, currency, description")
    .eq("tenant_id", me.user.id);

  if (status !== "all") query = query.eq("status", status);
  if (q) {
    // tolerate missing description/number
    query = query.or(`number.ilike.%${q}%,description.ilike.%${q}%`);
  }

  // sort mapping
  const [by, dir] = (() => {
    switch (sort) {
      case "issued_asc":
        return ["issued_at", "asc"] as const;
      case "due_desc":
        return ["due_date", "desc"] as const;
      case "due_asc":
        return ["due_date", "asc"] as const;
      case "amount_asc":
        return ["total_amount", "asc"] as const;
      case "amount_desc":
        return ["total_amount", "desc"] as const;
      case "issued_desc":
      default:
        return ["issued_at", "desc"] as const;
    }
  })();

  query = query.order(by, { ascending: dir === "asc" });

  // pagination: fetch per+1 to detect "next"
  const from = (page - 1) * per;
  const to = from + per; // fetch one extra
  const { data, error } = await query.range(from, to);

  const rows = Array.isArray(data) ? data : [];
  const hasNext = rows.length > per;
  const visible = hasNext ? rows.slice(0, per) : rows;

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Invoices</h1>
        <Link href="/tenant" className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">Back to tenant</Link>
      </div>

      {/* controls */}
      <form className="mb-3 flex flex-wrap items-center gap-2 text-sm" action="/tenant/invoices" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search (number or description)"
          className="min-w-[240px] rounded-xl border px-3 py-2"
        />
        <select name="status" defaultValue={status} className="rounded-xl border px-3 py-2">
          {["all","open","paid","overdue","issued","draft"].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
        </select>
        <select name="sort" defaultValue={sort} className="rounded-xl border px-3 py-2">
          <option value="issued_desc">Issued ↓</option>
          <option value="issued_asc">Issued ↑</option>
          <option value="due_desc">Due ↓</option>
          <option value="due_asc">Due ↑</option>
          <option value="amount_desc">Amount ↓</option>
          <option value="amount_asc">Amount ↑</option>
        </select>
        <button className="rounded-xl border px-3 py-2 hover:bg-gray-50">Apply</button>
      </form>

      <div className="overflow-hidden rounded-2xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Number</th>
              <th className="px-3 py-2 font-medium">Issued</th>
              <th className="px-3 py-2 font-medium">Due</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={5}>{error ? "Could not load invoices." : "No invoices yet"}</td></tr>
            )}
            {visible.map((inv: any) => {
              const issued = inv?.issued_at ? new Date(inv.issued_at).toDateString() : "-";
              const due = inv?.due_date ? new Date(inv.due_date).toDateString() : "-";
              const isOverdueCalc = inv?.status !== "paid" && inv?.due_date && new Date(inv.due_date) < new Date();
              const badge = isOverdueCalc ? "OVERDUE" : String(inv?.status ?? "-").toUpperCase();
              const amount = typeof inv?.total_amount === "number" ? inv.total_amount : Number(inv?.total_amount ?? 0);
              return (
                <tr key={String(inv.id)} className="border-t">
                  <td className="px-3 py-2">
                    <Link href={`/tenant/invoices/${inv.id}`} className="underline">{inv?.number ?? inv?.id}</Link>
                  </td>
                  <td className="px-3 py-2">{issued}</td>
                  <td className="px-3 py-2">{due}</td>
                  <td className="px-3 py-2">{badge}</td>
                  <td className="px-3 py-2 text-right">{amount} {String(inv?.currency ?? "PKR").toUpperCase()}</td>
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
          href={preserve("/tenant/invoices", sp, { page: Math.max(1, page - 1) })}
        >
          ← Prev
        </Link>
        <span>Page {page}</span>
        <Link
          aria-disabled={!hasNext}
          className={`rounded-xl border px-3 py-2 ${!hasNext ? "pointer-events-none opacity-50" : "hover:bg-gray-50"}`}
          href={preserve("/tenant/invoices", sp, { page: page + 1 })}
        >
          Next →
        </Link>
      </div>
    </div>
  );
}
