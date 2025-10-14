// app/tenant/pay/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseClient';

type LeaseRow = { id: string; monthly_rent: number; unit: { unit_number: string | null } | null };

export default function TenantPayNowPage() {
  const supabase = getSupabaseBrowser();
  const [leases, setLeases] = useState<LeaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaseId, setLeaseId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess?.session) {
        setError('Please sign in');
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('lease')
        .select(`id, monthly_rent, unit:unit_id ( unit_number )`)
        .order('created_at', { ascending: false });

      if (error) setError(error.message);
      else {
        const rows = (data ?? []) as unknown as LeaseRow[];
        setLeases(rows);
        if (rows[0]?.id) setLeaseId(rows[0].id);
        if (rows[0]?.monthly_rent) setAmount(String(rows[0].monthly_rent));
      }
      setLoading(false);
    })();
  }, [supabase]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setOk(null);
    if (!leaseId) { setError('Select a lease'); return; }
    const amt = Number(amount);
    if (!(amt > 0)) { setError('Amount must be greater than 0'); return; }

    const { data: sess } = await supabase.auth.getSession();
    if (!sess?.session) { setError('Please sign in'); return; }

    const { error } = await supabase.from('payment').insert({
      lease_id: leaseId,
      tenant_id: sess.session.user.id,
      amount: amt,
      reference: reference || null,
      status: 'PENDING',
    });

    if (error) setError(error.message);
    else {
      setOk('Payment record created. You will get a receipt after confirmation.');
      setReference('');
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Pay Now</h1>
      <p className="mb-4 text-sm opacity-80">
        Create a payment record. Admin will confirm it and issue your receipt.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Lease</label>
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={leaseId}
            onChange={(e) => setLeaseId(e.target.value)}
          >
            {leases.map(l => (
              <option key={l.id} value={l.id}>
                {l.unit?.unit_number ? `Unit ${l.unit.unit_number}` : 'Lease'} — rent {l.monthly_rent}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Amount</label>
          <input
            type="number" step="0.01" min="0"
            className="w-full rounded-lg border px-3 py-2"
            value={amount} onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Reference (bank ref / note)</label>
          <input
            type="text"
            className="w-full rounded-lg border px-3 py-2"
            value={reference} onChange={(e) => setReference(e.target.value)}
            placeholder="e.g., Bank TXN #12345"
          />
        </div>
        <button type="submit" className="rounded-lg border px-4 py-2">
          Create Payment
        </button>
        {ok && <div className="text-green-600 text-sm">{ok}</div>}
      </form>
    </div>
  );
}
