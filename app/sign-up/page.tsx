'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<'idle'|'submitting'|'success'>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return setError('Email is required.');
    if (!password) return setError('Password is required.');
    if (password !== confirm) return setError('Passwords do not match.');

    setStatus('submitting');

    try {
      const supabase = getSupabaseBrowser();
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: { emailRedirectTo: redirectTo },
      });

      if (signUpError) {
        // Common code: 'user_already_exists'
        setStatus('idle');
        return setError(signUpError.message || 'Could not sign up.');
      }

      setStatus('success');
      // If email confirmations are on, send them to the “Check your email” page.
      router.replace(`/check-email?email=${encodeURIComponent(trimmedEmail)}`);
    } catch (err: any) {
      console.error(err);
      setStatus('idle');
      setError('Unexpected error. Please try again.');
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="mt-2 text-sm text-gray-600">
        Use your email and a password to get started.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            className="w-full rounded-lg border px-3 py-2"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            autoComplete="new-password"
            className="w-full rounded-lg border px-3 py-2"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Confirm password</label>
          <input
            type="password"
            autoComplete="new-password"
            className="w-full rounded-lg border px-3 py-2"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={6}
            required
          />
        </div>

        {error ? (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full rounded-lg bg-black text-white px-4 py-2 disabled:opacity-70"
        >
          {status === 'submitting' ? 'Creating…' : 'Create account'}
        </button>

        <p className="text-xs text-gray-500">
          By continuing you agree to our standard terms.
        </p>
      </form>
    </div>
  );
}
