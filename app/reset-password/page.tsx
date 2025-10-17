'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import AuthHeader from '@/components/AuthHeader';
import AuthFooter from '@/components/AuthFooter';

export default function ResetPasswordPage() {
  const supabase = getSupabaseBrowser();
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    <div className="relative min-h-[100svh] bg-white text-gray-900 flex flex-col">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-40 z-0 h-80 bg-gradient-to-b from-emerald-200/60 via-emerald-100/40 to-transparent blur-2xl" />
      <AuthHeader />
      <main className="relative z-10 mx-auto w-full max-w-md grow px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Choose a new password</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input value={pw} onChange={e=>setPw(e.target.value)} type="password" required
            placeholder="New password" className="w-full rounded-lg border px-4 py-2" />
          <button disabled={loading} className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700">
            {loading ? 'Saving…' : 'Update password'}
          </button>
        </form>
        {ok && <p className="mt-4 text-sm text-emerald-700">Password updated. Redirecting…</p>}
        {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
      </main>
      <AuthFooter />
    </div>
  );
}
