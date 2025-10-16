'use client';

/**
 * app/sign-in/page.tsx
 * Sends magic link that returns to /auth/callback with a sensible default next=/tenant.
 */

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/client';

export default function SignInPage() {
  const search = useSearchParams();
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      // Prefer incoming ?next, else default to tenant dashboard
      const incomingNext = search.get('next');
      const next = incomingNext && incomingNext !== '/' ? incomingNext : '/tenant';

      const base =
        process.env.NEXT_PUBLIC_SITE_URL ??
        (typeof window !== 'undefined' ? window.location.origin : '');

      // Must be registered in Supabase Auth redirect URLs: https://www.rentback.app/auth/callback
      const emailRedirectTo = `${base}/auth/callback?next=${encodeURIComponent(next)}`;

      const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: { emailRedirectTo },
      });

      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Could not send magic link');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-[60vh] place-items-center p-6">
      <div className="w-full max-w-sm rounded-2xl border p-6 shadow-sm">
        <div className="flex items-center justify-center gap-2">
          <span className="inline-grid h-8 w-8 place-items-center rounded-md bg-emerald-600 text-sm font-semibold text-white">
            RB
          </span>
          <span className="text-base font-semibold tracking-tight">RentBack</span>
        </div>

        <h1 className="mt-4 text-xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-gray-600">We’ll email you a secure magic link.</p>

        {sent ? (
          <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            Check your inbox for the magic link.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <label className="block text-sm font-medium">
              Email
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none ring-emerald-600/20 focus:ring-2"
                placeholder="you@example.com"
              />
            </label>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
