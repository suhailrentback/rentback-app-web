'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';

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

    // Fetch role and route
    const { data: { user } } = await supabase.auth.getUser();
    let role = 'tenant';
    if (user?.id) {
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      role = data?.role || 'tenant';
    }

    const dest =
      next || (role === 'landlord' ? '/landlord' : role === 'staff' ? '/admin' : '/tenant');

    router.replace(dest);
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required
          placeholder="you@example.com" className="w-full rounded-lg border px-4 py-2" />
        <input value={pw} onChange={e=>setPw(e.target.value)} type="password" required
          placeholder="Password" className="w-full rounded-lg border px-4 py-2" />
        <button disabled={loading} className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
      <p className="mt-6 text-sm text-gray-600">
        <a className="text-emerald-700 underline" href="/forgot-password">Forgot your password?</a>
      </p>
      <p className="mt-2 text-sm text-gray-600">
        No account? <a className="text-emerald-700 underline" href="/sign-up">Sign up</a>
      </p>
    </main>
  );
}
