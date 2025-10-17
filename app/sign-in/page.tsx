'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import AuthHeader from '@/components/AuthHeader';
import AuthFooter from '@/components/AuthFooter';

export default function SignInPage() {
  const supabase = getSupabaseBrowser();
  const router = useRouter();
  const qp = useSearchParams();
  const next = qp.get('next') || '';

  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) { setLoading(false); setErr(error.message); return; }

    const { data: { user } } = await supabase.auth.getUser();
    let role = 'tenant';
    if (user?.id) {
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      role = data?.role || 'tenant';
    }
    const dest = next || (role === 'landlord' ? '/landlord' : role === 'staff' ? '/admin' : '/tenant');
    router.replace(dest);
  }

  return (
    <div className="relative min-h-[100svh] bg-white text-gray-900 flex flex-col">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-40 z-0 h-80 bg-gradient-to-b from-emerald-200/60 via-emerald-100/40 to-transparent blur-2xl" />
      <AuthHeader />
      <main className="relative z-10 mx-auto w-full max-w-md grow px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-gray-600">Sign in with your email and password.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required
            placeholder="you@example.com" className="w-full rounded-lg border px-4 py-2" />
          <input value={pw} onChange={e=>setPw(e.target.value)} type="password" required
            placeholder="Password" className="w-full rounded-lg border px-4 py-2" />
          <button disabled={loading} className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {err && <p className="mt-4 text-sm text-red-600">{err}</p>}

        <div className="mt-6 text-sm text-gray-600">
          <a className="text-emerald-700 underline" href="/forgot-password">Forgot your password?</a>
          <div className="mt-2">No account? <a className="text-emerald-700 underline" href="/sign-up">Sign up</a></div>
        </div>
      </main>
      <AuthFooter />
    </div>
  );
}
