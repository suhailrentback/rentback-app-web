// WEB: /app/sign-in/page.tsx
// Magic-link sign-in (no UI chrome changes elsewhere). Safe if env is missing:
// it will show an error toast but never break the build.

'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SignInPage() {
  const [email, setEmail] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = React.useState<string>('');

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://rentback.app');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setMessage('');

    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setStatus('error');
        setMessage('Auth is not configured yet. Ask dev to set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // After clicking the link in the email, user lands here.
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      });

      if (error) {
        setStatus('error');
        setMessage(error.message || 'Failed to send the magic link.');
      } else {
        setStatus('sent');
        setMessage('Magic link sent. Check your email.');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || 'Something went wrong.');
    }
  }

  return (
    <section className="py-16 max-w-md mx-auto px-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Enter your email and we’ll send you a magic link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-950 outline-none"
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          className="w-full px-4 py-3 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-70"
        >
          {status === 'sending' ? 'Sending...' : 'Send magic link'}
        </button>
      </form>

      {message ? (
        <div
          className={`mt-4 text-sm ${
            status === 'error' ? 'text-red-600' : 'text-emerald-600'
          }`}
        >
          {message}
        </div>
      ) : null}
    </section>
  );
}
