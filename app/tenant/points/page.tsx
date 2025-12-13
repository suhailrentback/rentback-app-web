'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type LedgerRow = {
  delta_points: number;
  reason: string | null;
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

export default function TenantPointsPage() {
  const sb = useMemo(() => getSupabase(), []);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await sb
        .from('reward_ledger')
        .select('delta_points, reason, created_at')
        .order('created_at', { ascending: false })
        .range(0, 199); // recent 200
      if (!isMounted) return;
      if (error) {
        setError(error.message);
        setRows([]);
      } else {
        setRows((data ?? []) as LedgerRow[]);
      }
      setLoading(false);
    })();
    return () => { isMounted = false; };
  }, [sb]);

  const balance = useMemo(
    () => rows.reduce((sum, r) => sum + (r.delta_points ?? 0), 0),
    [rows]
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">My Points</h1>
        <span className="text-sm opacity-70">Rewards</span>
      </header>

      <div className="rounded-2xl border p-6 shadow-sm">
        <div className="text-sm opacity-70">Current balance</div>
        <div className="mt-1 text-4xl font-bold tabular-nums">{balance}</div>
      </div>

      <div className="rounded-2xl border overflow-hidden">
        <div className="border-b px-4 py-3 font-medium">Recent activity</div>
        {loading ? (
          <div className="p-4 text-sm opacity-70">Loading…</div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">Error: {error}</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-sm opacity-70">No activity yet.</div>
        ) : (
          <ul className="divide-y">
            {rows.map((r, i) => (
              <li key={`${r.created_at}-${i}`} className="px-4 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm truncate">{r.reason ?? 'Activity'}</div>
                  <div className="text-xs opacity-70">{new Date(r.created_at).toLocaleString()}</div>
                </div>
                <div className={`text-sm font-semibold tabular-nums ${r.delta_points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {r.delta_points >= 0 ? `+${r.delta_points}` : r.delta_points}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
