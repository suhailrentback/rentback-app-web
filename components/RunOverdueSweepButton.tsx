'use client';

import { useState } from 'react';

export default function RunOverdueSweepButton() {
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setPending(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch('/api/overdue/run', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed');
      setMsg(`${json.updated} invoice(s) marked OVERDUE`);
    } catch (e: any) {
      setErr(e.message || 'Something went wrong');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={run}
        disabled={pending}
        className="rounded-xl px-3 py-1.5 border text-xs hover:bg-black/5 dark:hover:bg-white/10
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                   focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
      >
        {pending ? 'Running…' : 'Run OVERDUE sweep'}
      </button>
      {msg ? <span className="text-xs opacity-70">{msg}</span> : null}
      {err ? <span className="text-xs text-rose-600 dark:text-rose-300">{err}</span> : null}
    </div>
  );
}
