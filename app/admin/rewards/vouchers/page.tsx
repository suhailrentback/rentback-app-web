// app/admin/rewards/vouchers/page.tsx
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

function sb() {
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

export default async function AdminVouchersPage({
  searchParams,
}: { searchParams?: Record<string, string | string[] | undefined> }) {
  const supa = sb();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return <div className="p-6">Please sign in.</div>;
  const { data: prof } = await supa.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!prof || !["staff","admin"].includes((prof as any).role)) return <div className="p-6">Not permitted.</div>;

  const { data: offers } = await supa.from("reward_offers")
    .select("id,title")
    .order("title", { ascending: true });

  // simple counts
  const { data: counts } = await supa
    .from("reward_vouchers")
    .select("offer_id,is_claimed")
    .limit(10000);

  const map = new Map<string, { total: number; free: number }>();
  (counts ?? []).forEach((r: any) => {
    const m = map.get(r.offer_id) || { total: 0, free: 0 };
    m.total += 1;
    if (!r.is_claimed) m.free += 1;
    map.set(r.offer_id, m);
  });

  const ok = searchParams?.ok === "1";
  const err = typeof searchParams?.err === "string" ? searchParams?.err : "";

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Rewards — Voucher generator</h1>

      {ok && <div className="rounded-xl border p-3 text-sm">Vouchers generated.</div>}
      {err && <div className="rounded-xl border p-3 text-sm">Error: {err}</div>}

      <section className="rounded-2xl border p-4 space-y-3">
        <h2 className="font-medium">Generate codes</h2>
        <form method="post" action="/admin/api/rewards/vouchers/generate" className="grid gap-3 md:grid-cols-2">
          <select name="offer_id" required className="border rounded-xl p-2 md:col-span-2">
            <option value="">Select offer…</option>
            {(offers ?? []).map((o: any) => (
              <option key={o.id} value={o.id}>{o.title}</option>
            ))}
          </select>
          <input name="prefix" placeholder="Prefix (e.g., RENT-)" className="border rounded-xl p-2" />
          <input name="count" type="number" min={1} max={5000} defaultValue={50} className="border rounded-xl p-2" />
          <button className="rounded-2xl border px-4 py-2 md:col-span-2">Generate</button>
        </form>
      </section>

      <section className="rounded-2xl border">
        <div className="p-4 border-b"><h2 className="font-medium">Offer voucher inventory</h2></div>
        <div className="divide-y">
          {(offers ?? []).map((o: any) => {
            const c = map.get(o.id) || { total: 0, free: 0 };
            return (
              <div key={o.id} className="p-4 flex items-center justify-between">
                <div className="font-medium">{o.title}</div>
                <div className="text-sm opacity-80">Total: {c.total} • Free: {c.free}</div>
              </div>
            );
          })}
          {(offers ?? []).length === 0 && <div className="p-4 text-sm opacity-70">No offers.</div>}
        </div>
      </section>
    </div>
  );
}
