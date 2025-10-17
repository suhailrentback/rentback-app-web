'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';

export default function SignUpPage() {
  const supabase = getSupabaseBrowser();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null); setMsg(null);
    const redirectTo = `${window.location.origin}/onboarding`;
    const { error } = await supabase.auth.signUp({
      email, password: pw,
      options: { emailRedirectTo: redirectTo },
    });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setMsg('Check your email to confirm your account, then come back to sign in.');
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="mt-2 text-sm text-gray-600">Use your email and a password.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required
          placeholder="you@example.com" className="w-full rounded-lg border px-4 py-2" />
        <input value={pw} onChange={e=>setPw(e.target.value)} type="password" required
          placeholder="Password" className="w-full rounded-lg border px-4 py-2" />
        <button disabled={loading} className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white">
          {loading ? 'Creating...' : 'Sign up'}
        </button>
      </form>

      {msg && <p className="mt-4 text-sm text-emerald-700">{msg}</p>}
      {err && <p className="mt-4 text-sm text-red-600">{err}</p>}

      <p className="mt-6 text-sm text-gray-600">
        Already have an account? <a className="text-emerald-700 underline" href="/sign-in">Sign in</a>
      </p>
    </main>
  );
}
