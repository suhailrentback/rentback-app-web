'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowser } from '@/lib/supabase';

type Status = 'ready' | 'updating' | 'done' | 'error';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<Status>('ready');
  const [msg, setMsg] = useState<string>('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'updating') return;

    // Basic checks
    if (!password || !confirm) {
      setStatus('error');
      setMsg('Please enter and confirm your new password.');
      return;
    }
    if (password !== confirm) {
      setStatus('error');
      setMsg('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setStatus('error');
      setMsg('Password must be at least 8 characters.');
      return;
    }

    setStatus('updating');
    setMsg('');

    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setStatus('error');
        setMsg(error.message || 'Could not update password. Try again.');
        return;
      }

      setStatus('done');
      setMsg('Password updated. You can now sign in with your new password.');
    } catch (err) {
      setStatus('error');
      setMsg('Unexpected error. Please try again.');
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <div className="mb-6">
        <Link href="/sign-in" className="text-sm underline">
          ← Back to Sign In
        </Link>
      </div>

      <h1 className="text-xl font-semibold">Reset password</h1>
      <p className="mt-2 text-sm text-gray-600">
        Enter a new password for your account.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm">New password</label>
          <input
            type="password"
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm">Confirm new password</label>
          <input
            type="password"
            className="w-full rounded-xl border px-3 py-2 text-sm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        {msg && (
          <div
            className={`rounded-xl border px-3 py-2 text-sm ${
              status === 'error' ? 'border-red-300 text-red-700' : 'border-green-300 text-green-700'
            }`}
          >
            {msg}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'updating'}
          className="w-full rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {status === 'updating' ? 'Updating…' : 'Update password'}
        </button>
      </form>

      {status === 'done' && (
        <div className="mt-4 text-sm">
          <Link href="/sign-in" className="underline">
            Go to Sign In
          </Link>
        </div>
      )}
    </div>
  );
}
