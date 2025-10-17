'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const supabase = getSupabaseBrowser();
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // When user lands from email link, Supabase sets a session; we just update password
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setOk(true);
    setTimeout(()=>router.replace('/sign-in'), 1200);
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold">Choose a new password</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input value={pw} onChange={e=>setPw(e.target.value)} type="password" required
          placeholder="New password" className="w-full rounded-lg border px-4 py-2" />
        <button disabled={loading} className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white">
          {loading ? 'Saving...' : 'Update password'}
        </button>
      </form>
      {ok && <p className="mt-4 text-sm text-emerald-700">Password updated. Redirecting…</p>}
      {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
    </main>
  );
}
