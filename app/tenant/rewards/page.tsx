// app/tenant/rewards/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseClient';
import { useI18n } from '@/lib/i18n/index';

type Offer = {
  id: string;
  name: string;
  points_cost: number;
  stock: number | null;
  expires_at: string | null;
};

export default function TenantRewardsPage() {
  const supabase = getSupabaseBrowser();
  const { t, lang } = useI18n();

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
      if (!sess?.session) { setError(t('common.signInRequired')); setLoading(false); return; }
      await load();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, lang]);

  async function redeem(offerId: string) {
    setBusy(offerId); setOk(null); setError(null);
    try {
      const res = await supabase.rpc('redeem_offer', { p_offer_id: offerId });
      if (res.error) throw res.error;
      setOk(t('rewards.redeemed'));
      await load();
    } catch (e: any) {
      setError(e.message ?? 'Redeem failed');
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div className="p-6" role="status" aria-live="polite">{t('common.loading')}</div>;
  if (error) return <div className="p-6 text-red-600" role="alert" aria-live="assertive">Error: {error}</div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold">{t('rewards.title')}</h1>

      <div className="rounded-xl border p-4" aria-live="polite" role="status">
        <div className="text-sm opacity-70">{t('rewards.balance')}</div>
        <div className="text-2xl font-semibold">{balance}</div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">{t('rewards.availableOffers')}</h2>
        <div className="grid gap-3">
          {offers.length === 0 && (
            <div className="rounded-xl border p-4">{t('rewards.noOffers')}</div>
          )}
          {offers.map(o => {
            const expired = o.expires_at ? new Date(o.expires_at) <= new Date() : false;
            const disabled =
              expired || (o.stock !== null && o.stock <= 0) || balance < o.points_cost || busy === o.id;
            return (
              <div key={o.id} className="rounded-xl border p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{o.name}</div>
                  <div className="text-sm opacity-70">
                    {t('rewards.cost')}: {o.points_cost} pts
                    {' · '}
                    {t('rewards.stock')}: {o.stock !== null ? o.stock : t('rewards.unlimited')}
                    {o.expires_at ? ` · ${t('rewards.expires')}: ${new Date(o.expires_at).toLocaleDateString()}` : ''}
                  </div>
                </div>
                <button
                  onClick={() => redeem(o.id)}
                  disabled={disabled}
                  aria-disabled={disabled}
                  aria-busy={busy===o.id}
                  aria-label={busy===o.id ? t('rewards.redeeming') : t('rewards.redeem')}
                  className="rounded-lg border px-3 py-1"
                >
                  {busy === o.id ? t('rewards.redeeming') : t('rewards.redeem')}
                </button>
              </div>
            );
          })}
        </div>
        {ok && <div className="text-green-700 text-sm mt-2" role="status" aria-live="polite">{ok}</div>}
      </div>
    </div>
  );
}
