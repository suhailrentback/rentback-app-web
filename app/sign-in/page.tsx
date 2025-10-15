'use client';

// app/sign-in/page.tsx
// Simple, branded magic-link sign-in.
// Always sets emailRedirectTo to /auth/callback with ?next=... so the callback can complete both flows.

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function SignInPage() {
  const search = useSearchParams();
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const next = search.get('next') || '/';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSent(false);

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

      const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo, // ensures we land on /auth/callback
        },
      });

      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setError(err?.message || 'Could not send magic link. Please try again.');
    }
  }

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-6 py-12">
      <div className="w-full rounded-2xl border p-6 shadow-sm">
        <div className="mb-4 text-center">
          <div className="mx-auto inline-grid h-10 w-10 place-items-center rounded-md bg-emerald-600 text-white">RB</div>
          <h1 className="mt-3 text-xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-gray-600">
            We’ll email you a secure magic link to continue.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@rentback.app"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </label>

          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            Send magic link
          </button>

          {sent && (
            <p className="text-sm text-emerald-700">
              Link sent. Please check your inbox and open it on this device.
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}
        </form>

        <div className="mt-4 text-center text-xs text-gray-500">
          <span>Having trouble?</span>{' '}
          <Link className="text-emerald-700 underline" href="/sign-in?next=/">
            Try again
          </Link>
        </div>
      </div>
    </div>
  );
}
