// app/landlord/ledger/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseClient';

type Profile = { role: 'TENANT'|'LANDLORD'|'STAFF'|'ADMIN' };
type LedgerRow = {
  id: string;
  entry_type: 'CREDIT'|'DEBIT';
  amount: number;
  memo: string | null;
  created_at: string;
  payment?: { id: string | null } | null;
  payout?: { id: string | null } | null;
};

export default function LandlordLedgerPage() {
  const supabase = getSupabaseBrowser();
  const [role, setRole] = useState<Profile['role'] | null>(null);
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess?.session) { setError('Please sign in'); setLoading(false); return; }

      const me = await supabase.from('profile').select('role').eq('user_id', sess.session.user.id).maybeSingle();
      if (me.error) { setError(me.error.message); setLoading(false); return; }
      setRole(me.data?.role ?? null);
      if (me.data?.role !== 'LANDLORD') { setLoading(false); return; }

      const { data, error } = await supabase
        .from('landlord_ledger')
        .select(`
          id, entry_type, amount, memo, created_at,
          payment:payment_id ( id ),
          payout:payout_id ( id )
        `)
        .order('created_at', { ascending: false });

      if (error) setError(error.message);
      else setRows((data ?? []) as any);
      setLoading(false);
    })();
  }, [supabase]);

  const balance = useMemo(() => {
    return rows.reduce((acc, r) => acc + (r.entry_type === 'CREDIT' ? Number(r.amount) : -Number(r.amount)), 0);
  }, [rows]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (role !== 'LANDLORD') return <div className="p-6">Not permitted.</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">My Ledger</h1>
      <div className="rounded-xl border p-4">
        <div className="text-sm opacity-70">Current Balance</div>
        <div className="text-2xl font-semibold">{balance.toFixed(2)}</div>
      </div>

      <div className="rounded-2xl border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-3">Date</th>
              <th className="p-3">Type</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Linked</th>
              <th className="p-3">Memo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b">
                <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-3">{r.entry_type}</td>
                <td className="p-3">{r.amount}</td>
                <td className="p-3">
                  {r.payment?.id ? `Payment ${r.payment.id}` : r.payout?.id ? `Payout ${r.payout.id}` : '—'}
                </td>
                <td className="p-3">{r.memo ?? '—'}</td>
              </tr>
            ))}
            {!rows.length && <tr><td className="p-3" colSpan={5}>No entries yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
