'use client';

import { useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const supabase = getSupabaseBrowser();
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null); setMsg(null);
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setMsg('If that email exists, a reset link is on its way.');
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold">Reset your password</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required
          placeholder="you@example.com" className="w-full rounded-lg border px-4 py-2" />
        <button disabled={loading} className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white">
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
      {msg && <p className="mt-4 text-sm text-emerald-700">{msg}</p>}
      {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
    </main>
  );
}
