// app/tenant/rewards/page.tsx
import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Offer = {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  is_active: boolean;
  stock: number | null;
  created_at: string;
  updated_at: string;
};

async function getData() {
  const sb = await createClient(cookies());
  const [{ data: userResp }, offersResp, ledgerResp] = await Promise.all([
    sb.auth.getUser(),
    sb.from("reward_offers")
      .select("*")
      .eq("is_active", true)
      .order("points_cost", { ascending: true }),
    sb.from("reward_ledger").select("delta_points").limit(2000),
  ]);

  const user = userResp?.user ?? null;
  const offers = (offersResp.data as Offer[] | null) ?? [];
  const currentPoints =
    (ledgerResp.data ?? []).reduce((sum, r: any) => sum + (r?.delta_points ?? 0), 0) || 0;

  return { user, offers, currentPoints };
}

export const metadata = { title: "Rewards — RentBack" };

export default async function RewardsPage({
  searchParams,
}: {
  searchParams: { ok?: string; code?: string; err?: string };
}) {
  const { user, offers, currentPoints } = await getData();
  const ok = searchParams?.ok === "1";
  const code = searchParams?.code || "";
  const err = searchParams?.err || "";

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Rewards</h1>
        <Link href="/tenant/points" className="underline text-sm">
          View points history →
        </Link>
      </header>

      <section className="rounded-xl border p-4 bg-white/60 dark:bg-black/20">
        <div className="text-sm opacity-75">Your points</div>
        <div className="text-4xl font-bold tabular-nums">{currentPoints.toLocaleString()}</div>
      </section>

      {ok && (
        <div className="rounded-lg border bg-green-50 dark:bg-green-900/20 p-4 text-sm">
          Redemption successful.{" "}
          {code ? (
            <>
              Voucher code: <span className="font-mono font-semibold">{code}</span>
            </>
          ) : (
            "Voucher created."
          )}
        </div>
      )}
      {err && (
        <div className="rounded-lg border bg-red-50 dark:bg-red-900/20 p-4 text-sm">
          Redemption failed: <span className="font-mono">{err}</span>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Available offers</h2>
        <div className="grid gap-3">
          {offers.length === 0 && (
            <div className="rounded-lg border p-4 text-sm opacity-70">
              No active offers right now.
            </div>
          )}
          {offers.map((o) => {
            const disabled =
              (o.stock !== null && o.stock <= 0) || currentPoints < o.points_cost;
            const shortage = Math.max(0, o.points_cost - currentPoints);
            return (
              <div key={o.id} className="rounded-xl border p-4 flex items-start justify-between">
                <div>
                  <div className="font-medium">{o.title}</div>
                  {o.description && (
                    <div className="text-sm opacity-75 mt-0.5">{o.description}</div>
                  )}
                  <div className="text-xs mt-2 flex gap-3">
                    <span className="inline-flex items-center rounded-full border px-2 py-0.5">
                      Cost: {o.points_cost} pts
                    </span>
                    <span className="inline-flex items-center rounded-full border px-2 py-0.5">
                      {o.stock === null ? "Unlimited stock" : `Stock: ${o.stock}`}
                    </span>
                  </div>
                </div>
                <form
                  method="post"
                  action="/api/rewards/redeem"
                  className="flex items-center gap-2"
                >
                  <input type="hidden" name="offerId" value={o.id} />
                  <button
                    type="submit"
                    disabled={disabled}
                    className="rounded-lg border px-3 py-1.5 text-sm hover:bg-black/5 disabled:opacity-50"
                  >
                    Redeem
                  </button>
                  {disabled && shortage > 0 && (
                    <div className="text-xs opacity-70">Need {shortage} more pts</div>
                  )}
                </form>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
