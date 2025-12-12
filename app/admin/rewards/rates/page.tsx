// app/admin/rewards/rates/page.tsx
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

export default async function AdminRatesPage() {
  const supa = sb();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return <div className="p-6">Please sign in.</div>;
  const { data: prof } = await supa.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!prof || !["staff","admin"].includes((prof as any).role)) return <div className="p-6">Not permitted.</div>;

  const { data } = await supa
    .from("reward_rates")
    .select("id,currency,points_per_100_cents,is_active,created_at,updated_at")
    .order("currency", { ascending: true })
    .limit(200);

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Rewards — Earn rates</h1>

      <section className="rounded-2xl border p-4 space-y-3">
        <h2 className="font-medium">Create / update</h2>
        <form method="post" action="/admin/api/rewards/rates" className="grid gap-3 md:grid-cols-2">
          <input name="currency" placeholder="Currency (e.g., PKR, USD)" className="border rounded-xl p-2" />
          <input name="points_per_100_cents" type="number" min={0} defaultValue={1} className="border rounded-xl p-2" />
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" name="is_active" defaultChecked />
            <span>Active</span>
          </label>
          <div />
          <button className="rounded-2xl border px-4 py-2 md:col-span-2">Save</button>
        </form>
      </section>

      <section className="rounded-2xl border overflow-x-auto">
        <div className="p-4 border-b"><h2 className="font-medium">All rates</h2></div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-black/5">
              <th className="text-left p-2">Currency</th>
              <th className="text-left p-2">Pts / 100 cents</th>
              <th className="text-left p-2">Active</th>
              <th className="text-left p-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.currency}</td>
                <td className="p-2">{r.points_per_100_cents}</td>
                <td className="p-2">{r.is_active ? "Yes" : "No"}</td>
                <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {(data ?? []).length === 0 && <tr><td className="p-3" colSpan={4}>No rates set.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}
