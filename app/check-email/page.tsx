'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

export default function CheckEmailPage() {
  const search = useSearchParams();
  const email = search.get('email') ?? '';
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [msg, setMsg] = useState<string | null>(null);

  async function handleResend() {
    if (!email) return;
    setStatus('sending');
    setMsg(null);

    try {
      const supabase = getSupabaseBrowser();
      const resend = (supabase as any)?.auth?.resend;

      if (typeof resend === 'function') {
        const { error } = await resend({ type: 'signup', email });
        if (error) throw error;
        setStatus('sent');
        setMsg('Verification email resent. Check your inbox.');
      } else {
        // Library doesn’t expose `auth.resend` — just inform the user.
        setStatus('error');
        setMsg('Resend isn’t available right now. Please wait a minute and try again.');
      }
    } catch (_e) {
      setStatus('error');
      setMsg('Couldn’t resend right now. Please try again in a minute.');
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-2">Check your email</h1>
      <p className="text-sm text-gray-600 mb-4">
        We sent a verification link to{' '}
        <span className="font-medium">{email || 'your inbox'}</span>. Click it to continue.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={handleResend}
          disabled={status === 'sending'}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          {status === 'sending' ? 'Sending…' : 'Resend email'}
        </button>
        <Link href="/sign-in" className="text-sm underline">
          Back to sign in
        </Link>
      </div>

      {msg && (
        <p
          className={`mt-3 text-sm ${
            status === 'sent' ? 'text-green-700' : status === 'error' ? 'text-red-700' : 'text-gray-600'
          }`}
        >
          {msg}
        </p>
      )}
    </main>
  );
}
