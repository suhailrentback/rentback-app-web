// app/tenant/payments/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseClient';

type PaymentRow = {
  id: string;
  amount: number;
  status: 'PENDING'|'CONFIRMED';
  reference: string | null;
  paid_at: string | null;
  created_at: string;
  receipt?: { pdf_url: string | null }[] | null;
};

export default function PaymentsPage() {
  const supabase = getSupabaseBrowser();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess?.session) { setLoading(false); return; }
      setToken(sess.session.access_token);

      const { data, error } = await supabase
        .from('payment')
        .select(`
          id, amount, status, reference, paid_at, created_at,
          receipt:receipt ( pdf_url )
        `)
        .order('created_at', { ascending: false });

      if (error) setError(error.message);
      else setRows((data ?? []) as unknown as PaymentRow[]);
      setLoading(false);
    })();
  }, [supabase]);

  if (loading) return <div className="p-6">Loading payments…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!rows.length) return (
    <div className="p-6">
      <div>No payments yet.</div>
      <a className="underline" href="/tenant/pay">Create a payment</a>
    </div>
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Payments</h1>
        <a className="underline" href="/tenant/pay">Pay Now</a>
      </div>
      <div className="rounded-2xl border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-3">Date</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Reference</th>
              <th className="p-3">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const directUrl = r.receipt?.[0]?.pdf_url ?? null;
              const date = r.paid_at ?? r.created_at;
              const fallback = token ? `/api/receipts/${r.id}?token=${encodeURIComponent(token)}` : null;

              return (
                <tr key={r.id} className="border-b">
                  <td className="p-3">{new Date(date).toLocaleString()}</td>
                  <td className="p-3">{r.amount}</td>
                  <td className="p-3">{r.status}</td>
                  <td className="p-3">{r.reference ?? '—'}</td>
                  <td className="p-3">
                    {r.status === 'CONFIRMED'
                      ? (directUrl
                          ? <a className="underline" href={directUrl} target="_blank" rel="noreferrer">Download</a>
                          : (fallback
                              ? <a className="underline" href={fallback}>Download</a>
                              : '—'))
                      : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
