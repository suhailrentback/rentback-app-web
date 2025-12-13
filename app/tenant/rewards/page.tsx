'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type Offer = {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  is_active: boolean;
  stock: number | null; // null = unlimited
  updated_at: string;
};

type Redemption = {
  id: string;
  voucher_code: string | null;
  created_at: string;
};

function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  if (!url || !anon) {
    throw new Error('Supabase env not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  }
  return createClient(url, anon);
}

export default function RewardsPage() {
  const sb = useMemo(() => getSupabase(), []);
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [ledgerPoints, setLedgerPoints] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [success, setSuccess] = useState<Redemption | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    // Load offers
    const { data: offersData, error: offersErr } = await sb
      .from('reward_offers')
      .select('id,title,description,points_cost,is_active,stock,updated_at')
      .eq('is_active', true)
      .order('points_cost', { ascending: true });

    // Compute balance by summing recent ledger (client-side)
    const { data: ledgerData, error: ledgerErr } = await sb
      .from('reward_ledger')
      .select('delta_points')
      .order('created_at', { ascending: false })
      .range(0, 999);

    if (offersErr || ledgerErr) {
      setError((offersErr?.message ?? '') || (ledgerErr?.message ?? 'Failed to load rewards.'));
      setOffers([]);
      setLedgerPoints(0);
      setLoading(false);
      return;
    }

    setOffers((offersData ?? []) as Offer[]);
    const balance = (ledgerData ?? []).reduce((sum, r: any) => sum + (r.delta_points ?? 0), 0);
    setLedgerPoints(balance);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function redeem(offer: Offer) {
    setRedeeming(offer.id);
    setSuccess(null);
    setError(null);

    const { data, error } = await sb.rpc('rpc_redeem_offer', { p_offer_id: offer.id });
    setRedeeming(null);

    if (error) {
      // Friendly messages for known exceptions thrown by the SQL function
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('insufficient_points')) setError('Not enough points to redeem this offer.');
      else if (msg.includes('out_of_stock')) setError('This offer is out of stock.');
      else if (msg.includes('offer_inactive')) setError('This offer is not active.');
      else if (msg.includes('offer_not_found')) setError('Offer not found.');
      else setError(error.message);
      return;
    }

    const redemption = data as Redemption;
    setSuccess(redemption);
    await load();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Rewards</h1>
        <div className="text-sm opacity-70">Balance: <span className="font-semibold tabular-nums">{ledgerPoints}</span> pts</div>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
          <div className="font-medium">Redeemed!</div>
          <div className="mt-1">Voucher code: <span className="font-mono text-base">{success.voucher_code ?? '(generated)'}</span></div>
          <div className="opacity-70">Saved at {new Date(success.created_at).toLocaleString()}</div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {loading ? (
          <div className="col-span-2 p-4 text-sm opacity-70">Loading offers…</div>
        ) : offers.length === 0 ? (
          <div className="col-span-2 p-4 text-sm opacity-70">No active offers yet. Check back soon.</div>
        ) : (
          offers.map((o) => {
            const out = o.stock !== null && o.stock <= 0;
            const cantAfford = ledgerPoints < o.points_cost;
            const disabled = out || cantAfford || !!redeeming;

            return (
              <div key={o.id} className="rounded-2xl border p-5 shadow-sm flex flex-col">
                <div className="flex-1">
                  <div className="text-lg font-semibold">{o.title}</div>
                  {o.description && <div className="mt-1 text-sm opacity-80">{o.description}</div>}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-semibold tabular-nums">{o.points_cost}</span> pts
                    <span className="mx-2 opacity-30">•</span>
                    <span className={`text-xs ${out ? 'text-red-600' : 'opacity-70'}`}>
                      {o.stock === null ? 'Unlimited' : o.stock <= 0 ? 'Out of stock' : `${o.stock} left`}
                    </span>
                  </div>
                  <button
                    onClick={() => redeem(o)}
                    disabled={disabled}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium border transition
                      ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:shadow'}`
                    }
                  >
                    {redeeming === o.id ? 'Redeeming…' : cantAfford ? 'Not enough points' : out ? 'Out of stock' : 'Redeem'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
