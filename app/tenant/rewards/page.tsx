// app/tenant/rewards/page.tsx
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

function createSb() {
  const cs = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(n){ return cs.get(n)?.value; },
        set(n,v,o:CookieOptions){ cs.set({ name:n, value:v, ...o }); },
        remove(n,o:CookieOptions){ cs.set({ name:n, value:"", ...o }); },
      }
    }
  );
}

export default async function TenantRewardsPage({
  searchParams,
}: {
  searchParams?: Record<string, string>;
}) {
  const sb = createSb();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return <div className="p-6">Please sign in.</div>;
  }

  const [{ data: bal }, { data: offers }] = await Promise.all([
    sb.from("reward_balances").select("points").eq("user_id", user.id).maybeSingle(),
    sb.from("reward_offers").select("id,title,description,points_cost,is_active").eq("is_active", true).order("points_cost", { ascending: true }).limit(200),
  ]);

  const ok = (searchParams?.ok === "1");
  const err = searchParams?.err;

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-semibold">My Rewards</h1>

      {ok && <div className="rounded-xl border p-3 text-sm">Redemption completed.</div>}
      {err && <div className="rounded-xl border p-3 text-sm">Error: {err}</div>}

      <section className="rounded-2xl border p-4">
        <div className="text-sm opacity-70">Current balance</div>
        <div className="text-3xl font-bold">{(bal as any)?.points ?? 0} pts</div>
      </section>

      <section className="rounded-2xl border">
        <div className="p-4 border-b">
          <h2 className="font-medium">Available offers</h2>
        </div>
        <div className="divide-y">
          {(offers ?? []).map((o: any) => (
            <div key={o.id} className="p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
              <div className="flex-1">
                <div className="font-medium">{o.title}</div>
                {o.description && <div className="text-sm opacity-80">{o.description}</div>}
              </div>
              <div className="md:w-48">
                <div className="text-sm opacity-70">Cost</div>
                <div className="font-semibold">{o.points_cost} pts</div>
              </div>
              <form method="post" action="/tenant/api/rewards/redeem">
                <input type="hidden" name="offer_id" value={o.id} />
                <button className="rounded-2xl border px-4 py-2">Redeem</button>
              </form>
            </div>
          ))}
          {(offers ?? []).length === 0 && (
            <div className="p-4 text-sm opacity-70">No active offers right now.</div>
          )}
        </div>
      </section>
    </div>
  );
}
