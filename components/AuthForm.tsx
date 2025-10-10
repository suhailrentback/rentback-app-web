// components/AuthForm.tsx
'use client';

import * as React from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

type Props = {
  title?: string;
  subtitle?: string;
  nextPath?: string; // where to go after callback
};

export default function AuthForm({ title = 'Sign in', subtitle = 'RentBack — secure access', nextPath = '/' }: Props) {
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const supabase = supabaseBrowser();
      const site = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${site}/auth/callback?next=${encodeURIComponent(nextPath)}`,
          shouldCreateUser: true,
        },
      });

      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      setErr(e?.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center space-y-1 mb-6">
        <div className="text-3xl font-bold">{title}</div>
        <div className="text-sm opacity-70">{subtitle}</div>
      </div>

      {sent ? (
        <div className="rounded-2xl border border-emerald-600/30 bg-emerald-600/10 p-4">
          <div className="font-medium">Check your inbox</div>
          <div className="text-sm opacity-80">We sent a magic link to <span className="font-mono">{email}</span>.</div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm opacity-80">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 outline-none focus:ring-2 ring-emerald-600"
              placeholder="you@rentback.app"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
          >
            {loading ? 'Sending…' : 'Send magic link'}
          </button>

          {err && <div className="text-sm text-red-600 dark:text-red-400">{err}</div>}
        </form>
      )}
    </div>
  );
}
