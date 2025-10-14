// app/landlord/payouts/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseClient';

type Profile = { role: 'TENANT'|'LANDLORD'|'STAFF'|'ADMIN' };
type LedgerRow = { entry_type: 'CREDIT'|'DEBIT'; amount: number; };
type PayoutRow = { id: string; amount: number; status: 'REQUESTED'|'APPROVED'|'DENIED'; requested_at: string; approved_at: string | null; denied_at: string | null; note: string | null; };

export default function LandlordPayoutsPage() {
  const supabase = getSupabaseBrowser();
  const [role, setRole] = useState<Profile['role'] | null>(null);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [amount, setAmount] = useState<string>('0');
  const [note, setNote] = useState<string>('');
  const [ok, setOk] = useState<string | null>(null);

  const balance = useMemo(() => {
    return ledger.reduce((acc, r) => acc + (r.entry_type === 'CREDIT' ? Number(r.amount) : -Number(r.amount)), 0);
  }, [ledger]);

  async function load() {
    const l = await supabase.from('landlord_ledger').select('entry_type, amount');
    if (l.error) { setError(l.error.message); return; }
    setLedger((l.data ?? []) as any);

    const p = await supabase.from('payout').select('id, amount, status, requested_at, approved_at, denied_at, note').order('requested_at', { ascending: false });
    if (p.error) { setError(p.error.message); return; }
    setPayouts((p.data ?? []) as any);

    // auto-suggest full balance if > 0
    if (balance > 0) setAmount(balance.toFixed(2));
  }

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess?.session) { setError('Please sign in'); setLoading(false); return; }

      const me = await supabase.from('profile').select('role').eq('user_id', sess.session.user.id).maybeSingle();
      if (me.error) { setError(me.error.message); setLoading(false); return; }
      setRole(me.data?.role ?? null);
      if (me.data?.role !== 'LANDLORD') { setLoading(false); return; }

      await load();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setOk(null);
    const amt = Number(amount);
    if (!(amt > 0)) { setError('Amount must be > 0'); return; }
    if (amt > balance + 1e-6) { setError('Amount exceeds available balance'); return; }

    const { data: sess } = await supabase.auth.getSession();
    if (!sess?.session) { setError('Please sign in'); return; }

    const { error } = await supabase.from('payout').insert({
      landlord_id: sess.session.user.id,
      amount: amt,
      status: 'REQUESTED',
      note: note || null,
    });
    if (error) setError(error.message);
    else {
      setOk('Payout requested. Admin will review.');
      setNote('');
      await load();
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (role !== 'LANDLORD') return <div className="p-6">Not permitted.</div>;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Request Payout</h1>

      <div className="rounded-xl border p-4">
        <div className="text-sm opacity-70">Available Balance</div>
        <div className="text-2xl font-semibold">{balance.toFixed(2)}</div>
      </div>

      <form onSubmit={submit} className="grid gap-3 rounded-2xl border p-4">
        <div>
          <label className="block text-sm mb-1">Amount</label>
          <input
            type="number" step="0.01" min="0"
            className="w-full rounded-lg border px-3 py-2"
            value={amount} onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Note (optional)</label>
          <input
            type="text"
            className="w-full rounded-lg border px-3 py-2"
            value={note} onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <button type="submit" className="rounded-lg border px-4 py-2">Request Payout</button>
        {ok && <div className="text-green-700 text-sm">{ok}</div>}
      </form>

      <div className="rounded-2xl border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-3">Requested</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Approved/Denied</th>
              <th className="p-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map(p => (
              <tr key={p.id} className="border-b">
                <td className="p-3">{new Date(p.requested_at).toLocaleString()}</td>
                <td className="p-3">{p.amount}</td>
                <td className="p-3">{p.status}</td>
                <td className="p-3">{p.approved_at ?? p.denied_at ?? '—'}</td>
                <td className="p-3">{p.note ?? '—'}</td>
              </tr>
            ))}
            {!payouts.length && <tr><td className="p-3" colSpan={5}>No payouts yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
