// components/AuthForm.tsx
'use client';

import { useState } from 'react';
import { supabaseClient } from '../lib/supabase/client';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const { error } = await supabaseClient.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` }});
    if (error) setErr(error.message);
    else setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-black/10 dark:border-white/10 p-6">
        <h2 className="text-lg font-semibold">Check your email</h2>
        <p className="opacity-80 text-sm mt-1">We sent a magic link to <strong>{email}</strong>. Open it on this device.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-black/10 dark:border-white/10 p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1 w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 outline-none"
        />
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button type="submit" className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 font-medium">
        Send magic link
      </button>
    </form>
  );
}
