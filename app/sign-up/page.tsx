'use client';

import { useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import AuthHeader from '@/components/AuthHeader';
import AuthFooter from '@/components/AuthFooter';

export default function SignUpPage() {
  const supabase = getSupabaseBrowser();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null); setMsg(null);
    const redirectTo = `${window.location.origin}/onboarding`;
    const { error } = await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: redirectTo } });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setMsg('Check your email to confirm your account, then come back to sign in.');
  }

  return (
    <div className="relative min-h-[100svh] bg-white text-gray-900 flex flex-col">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-40 z-0 h-80 bg-gradient-to-b from-emerald-200/60 via-emerald-100/40 to-transparent blur-2xl" />
      <AuthHeader />
      <main className="relative z-10 mx-auto w-full max-w-md grow px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
        <p className="mt-2 text-sm text-gray-600">Use your email and a password.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required
            placeholder="you@example.com" className="w-full rounded-lg border px-4 py-2" />
          <input value={pw} onChange={e=>setPw(e.target.value)} type="password" required
            placeholder="Password" className="w-full rounded-lg border px-4 py-2" />
          <button disabled={loading} className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700">
            {loading ? 'Creating…' : 'Sign up'}
          </button>
        </form>

        {msg && <p className="mt-4 text-sm text-emerald-700">{msg}</p>}
        {err && <p className="mt-4 text-sm text-red-600">{err}</p>}

        <p className="mt-6 text-sm text-gray-600">
          Already have an account? <a className="text-emerald-700 underline" href="/sign-in">Sign in</a>
        </p>
      </main>
      <AuthFooter />
    </div>
  );
}
