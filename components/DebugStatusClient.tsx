'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseClient';

export default function DebugStatusClient() {
  const supabase = getSupabaseBrowser();
  const [health, setHealth] = useState<any>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        const j = await res.json();
        setHealth(j);
      } catch {
        setHealth({ ok: false });
      }

      const { data } = await supabase.auth.getSession();
      setSession(data?.session ?? null);
    })();
  }, [supabase]);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border p-4">
        <div className="font-semibold">Health</div>
        <pre className="text-xs whitespace-pre-wrap">
{JSON.stringify(health, null, 2)}
        </pre>
      </div>

      <div className="rounded-xl border p-4">
        <div className="font-semibold">Auth session (client)</div>
        <pre className="text-xs whitespace-pre-wrap">
{JSON.stringify({
  hasSession: !!session,
  userId: session?.user?.id ?? null,
  expiresAt: session?.expires_at ?? null,
}, null, 2)}
        </pre>
      </div>
    </div>
  );
}
