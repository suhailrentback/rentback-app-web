// rentback-app-web/app/tenant/payments/page.tsx
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
  const [signedIn, setSignedIn] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      setSignedIn(Boolean(sess?.session));
      if (!sess?.session) { setLoading(false); return; }

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

  if (!signedIn) return <div className="p-6">Please sign in to view your payments.</div>;
  if (loading) return <div className="p-6">Loading payments…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!rows.length) return <div className="p-6">No payments yet.</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">My Payments</h1>
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
              const receiptUrl = r.receipt?.[0]?.pdf_url ?? null;
              const date = r.paid_at ?? r.created_at;
              return (
                <tr key={r.id} className="border-b">
                  <td className="p-3">{new Date(date).toLocaleString()}</td>
                  <td className="p-3">{r.amount}</td>
                  <td className="p-3">{r.status}</td>
                  <td className="p-3">{r.reference ?? '—'}</td>
                  <td className="p-3">
                    {receiptUrl ? (
                      <a className="underline" href={receiptUrl} target="_blank" rel="noreferrer">Download</a>
                    ) : '—'}
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
