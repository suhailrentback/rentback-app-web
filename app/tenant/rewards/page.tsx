// app/tenant/rewards/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseClient';

type Offer = {
  id: string;
  name: string;
  points_cost: number;
  stock: number | null;
  expires_at: string | null;
};

export default function TenantRewardsPage() {
  const supabase = getSupabaseBrowser();
  const [balance, setBalance] = useState<number>(0);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function load() {
    setError(null);
    const pts = await supabase.rpc('get_my_points');
    if (pts.error) { setError(pts.error.message); return; }
    setBalance((pts.data as number) ?? 0);

    const res = await supabase
      .from('reward_offer')
      .select('id, name, points_cost, stock, expires_at')
      .order('created_at', { ascending: false });
    if (res.error) { setError(res.error.message); return; }
    setOffers((res.data ?? []) as Offer[]);
  }

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess?.session) { setError('Please sign in'); setLoading(false); return; }
      await load();
      setLoading(false);
    })();
  }, [supabase]);

  async function redeem(offerId: string) {
    setBusy(offerId); setOk(null); setError(null);
    try {
      const res = await supabase.rpc('redeem_offer', { p_offer_id: offerId });
      if (res.error) throw res.error;
      setOk('Redeemed!');
      await load();
    } catch (e: any) {
      setError(e.message ?? 'Redeem failed');
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div className="p-6">Loading rewards…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold">My Rewards</h1>

      <div className="rounded-xl border p-4">
        <div className="text-sm opacity-70">Points Balance</div>
        <div className="text-2xl font-semibold">{balance}</div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Available Offers</h2>
        <div className="grid gap-3">
          {offers.length === 0 && (
            <div className="rounded-xl border p-4">No offers right now.</div>
          )}
          {offers.map(o => {
            const expired = o.expires_at ? new Date(o.expires_at) <= new Date() : false;
            const disabled = expired || (o.stock !== null && o.stock <= 0) || balance < o.points_cost || busy === o.id;
            return (
              <div key={o.id} className="rounded-xl border p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{o.name}</div>
                  <div className="text-sm opacity-70">
                    Cost: {o.points_cost} pts
                    {o.stock !== null ? ` · Stock: ${o.stock}` : ' · Unlimited'}
                    {o.expires_at ? ` · Expires: ${new Date(o.expires_at).toLocaleDateString()}` : ''}
                  </div>
                </div>
                <button
                  onClick={() => redeem(o.id)}
                  disabled={disabled}
                  className="rounded-lg border px-3 py-1"
                >
                  {busy === o.id ? 'Redeeming…' : 'Redeem'}
                </button>
              </div>
            );
          })}
        </div>
        {ok && <div className="text-green-700 text-sm mt-2">{ok}</div>}
      </div>
    </div>
  );
}
