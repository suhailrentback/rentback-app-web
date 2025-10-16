'use client';

// app/auth/callback/page.tsx
// Handles BOTH Supabase flows:
// 1) ?code=...  (PKCE): exchangeCodeForSession
// 2) #access_token=...&refresh_token=... (implicit): setSession
//
// After success, redirects to ?next=... or "/".

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/client';

function parseHashParams(hash: string): URLSearchParams {
  const raw = hash?.startsWith('#') ? hash.slice(1) : hash || '';
  return new URLSearchParams(raw);
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [message, setMessage] = useState<string>('Signing you in…');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const next = search.get('next') || '/';
        const code = search.get('code');

        if (code) {
          const { error } = await supabaseClient.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (!cancelled) router.replace(next);
          return;
        }

        const hashParams = parseHashParams(window.location.hash);
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');

        if (access_token && refresh_token) {
          const { error } = await supabaseClient.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) throw error;
          if (!cancelled) router.replace(next);
          return;
        }

        // Neither token style is present → send back to sign-in
        if (!cancelled) {
          setMessage('Missing auth token. Redirecting to sign in…');
          router.replace('/sign-in?error=missing_code');
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        if (!cancelled) {
          setMessage(err?.message || 'Sign-in failed. Please try again.');
          router.replace('/sign-in?error=callback_failed');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, search]);

  return (
    <div className="grid min-h-[60vh] place-items-center p-6">
      <div className="w-full max-w-sm rounded-2xl border p-6 text-center shadow-sm">
        <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-emerald-600/15" />
        <h1 className="mt-3 text-lg font-semibold">Signing you in</h1>
        <p className="mt-1 text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
}
