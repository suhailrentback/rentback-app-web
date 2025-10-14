// rentback-app-web/app/tenant/lease/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseClient';

type LeaseRow = {
  id: string;
  status: 'ACTIVE'|'ENDED'|'PENDING';
  start_date: string | null;
  end_date: string | null;
  monthly_rent: number;
  unit: {
    unit_number: string;
    property: {
      name: string | null;
      address: string | null;
    } | null;
  } | null;
};

export default function LeasePage() {
  const supabase = getSupabaseBrowser();
  const [loading, setLoading] = useState(true);
  const [lease, setLease] = useState<LeaseRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      setSignedIn(Boolean(sess?.session));
      if (!sess?.session) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('lease')
        .select(`
          id, status, start_date, end_date, monthly_rent,
          unit:unit_id (
            unit_number,
            property:property_id ( name, address )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) setError(error.message);
      else setLease(data as unknown as LeaseRow);
      setLoading(false);
    })();
  }, [supabase]);

  if (!signedIn) return <div className="p-6">Please sign in to view your lease.</div>;
  if (loading) return <div className="p-6">Loading your lease…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!lease) return <div className="p-6">No lease found.</div>;

  const prop = lease.unit?.property;
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">My Lease</h1>
      <div className="rounded-2xl border p-4 grid gap-2">
        <div><span className="font-medium">Status:</span> {lease.status}</div>
        <div><span className="font-medium">Start:</span> {lease.start_date ?? '—'}</div>
        <div><span className="font-medium">End:</span> {lease.end_date ?? '—'}</div>
        <div><span className="font-medium">Monthly Rent:</span> {lease.monthly_rent}</div>
        <div><span className="font-medium">Unit:</span> {lease.unit?.unit_number ?? '—'}</div>
        <div><span className="font-medium">Property:</span> {prop?.name ?? '—'}</div>
        <div><span className="font-medium">Address:</span> {prop?.address ?? '—'}</div>
      </div>
    </div>
  );
}
