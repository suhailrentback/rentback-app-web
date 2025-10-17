// app/sign-in/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';

export default function SignInPage() {
  const supabase = getSupabaseBrowser();
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next'); // may be /tenant, /landlord, /admin, or null

  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function destForRole(role: 'tenant' | 'landlord' | 'staff') {
    if (next && /^\/(tenant|landlord|admin)(\/|$)/.test(next)) {
      // honor explicit next if it’s a known dashboard path
      return next;
    }
    if (role === 'staff') return '/admin';
    if (role === 'landlord') return '/landlord';
    return '/tenant';
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pw,
    });

    if (error) {
      setLoading(false);
      setErr(error.message);
      return;
    }

    // Mirror session to server cookies + upsert profile/role + set rb_role
    const access_token = data.session?.access_token;
    const refresh_token = data.session?.refresh_token;
    if (access_token && refresh_token) {
      await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ access_token, refresh_token }),
        credentials: 'include',
      }).catch(() => {});
    }

    // Read role from server (authoritative) and route accordingly
    let role: 'tenant' | 'landlord' | 'staff' = 'tenant';
    try {
      const r = await fetch('/api/auth/sync', { method: 'GET', credentials: 'include' });
      const j = await r.json();
      if (j?.role === 'landlord' || j?.role === 'staff' || j?.role === 'tenant') role = j.role;
    } catch {}

    router.replace(destForRole(role));
  }

  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="mt-1 text-sm text-gray-600">Use your email and password.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border px-3 py-2"
        />
        <input
          type="password"
          required
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Your password"
          className="w-full rounded-lg border px-3 py-2"
        />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
