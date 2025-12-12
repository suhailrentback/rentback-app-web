// app/admin/rewards/ledger/page.tsx
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

function createSb() {
  const cs = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: {
      get(n){ return cs.get(n)?.value; },
      set(n,v,o:CookieOptions){ cs.set({ name:n, value:v, ...o }); },
      remove(n,o:CookieOptions){ cs.set({ name:n, value:"", ...o }); },
    } }
  );
}

function normOne<T>(x: any): T | null {
  if (!x) return null as any;
  if (Array.isArray(x)) return (x[0] ?? null) as any;
  return x as T;
}

export default async function AdminRewardsLedgerPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const sb = createSb();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return <div className="p-6">Please sign in.</div>;

  // staff/admin gate (RLS will also protect)
  const { data: prof } = await sb.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!prof || !["staff","admin"].includes((prof as any).role)) return <div className="p-6">Not permitted.</div>;

  const q = (typeof searchParams?.q === "string" ? searchParams?.q : "") || "";
  const src = (typeof searchParams?.source === "string" ? searchParams?.source : "") || "";

  let query = sb
    .from("reward_ledger")
    .select("id,user_id,delta_points,reason,source,created_at,payment_id,amount_cents,currency,profiles!inner(email)")
    .order("created_at", { ascending: false })
    .limit(300);

  if (src) query = query.eq("source", src);

  // For q, we filter on email ilike
  if (q) query = query.ilike("profiles.email", `%${q}%`);

  const { data, error } = await query;

  const rows = (data ?? []).map((r: any) => {
    const p = normOne<any>(r.profiles);
    return {
      id: r.id,
      email: p?.email ?? "",
      delta_points: r.delta_points,
      reason: r.reason,
      source: r.source,
      currency: r.currency,
      amount_cents: r.amount_cents,
      created_at: r.created_at,
    };
  });

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Rewards — Ledger</h1>

      <form className="flex flex-wrap gap-2" method="get">
        <input name="q" defaultValue={q} placeholder="Search email..." className="border rounded-xl p-2" />
        <select name="source" defaultValue={src} className="border rounded-xl p-2">
          <option value="">All sources</option>
          <option value="earn">Earn</option>
          <option value="redeem">Redeem</option>
        </select>
        <button className="rounded-2xl border px-4 py-2">Filter</button>
        <a
          className="rounded-2xl border px-4 py-2"
          href={`/admin/api/rewards/ledger/export${q || src ? `?${new URLSearchParams({ ...(q && { q }), ...(src && { source: src }) }).toString()}` : ""}`}
        >
          Export CSV
        </a>
      </form>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-black/5">
              <th className="text-left p-2">When</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Δ Points</th>
              <th className="text-left p-2">Source</th>
              <th className="text-left p-2">Reason</th>
              <th className="text-left p-2">Amt</th>
              <th className="text-left p-2">Cur</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-2">{r.email}</td>
                <td className="p-2">{r.delta_points}</td>
                <td className="p-2">{r.source}</td>
                <td className="p-2">{r.reason}</td>
                <td className="p-2">{typeof r.amount_cents === "number" ? (r.amount_cents/100).toFixed(2) : "-"}</td>
                <td className="p-2">{r.currency || "-"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="p-3 text-sm opacity-70" colSpan={7}>No entries.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
