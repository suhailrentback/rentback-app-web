'use client';

/**
 * app/auth/callback/page.tsx
 * Handles both Supabase flows (PKCE code or hash tokens),
 * then syncs tokens to a secure server cookie via /api/auth/sync.
 * Finally, redirect to ?next=... or a role-aware default.
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/client';

function parseHashParams(hash: string): URLSearchParams {
  const raw = hash?.startsWith('#') ? hash.slice(1) : hash || '';
  return new URLSearchParams(raw);
}

async function resolveRoleDefault(): Promise<string> {
  // Default destination if role missing
  let fallback = '/tenant';
  try {
    const { data: userRes } = await supabaseClient.auth.getUser();
    const user = userRes?.user;
    if (!user) return fallback;

    const { data: profile } = await supabaseClient
      .from('profile')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const role = profile?.role?.toUpperCase?.();
    if (role === 'LANDLORD') return '/landlord';
    if (role === 'TENANT') return '/tenant';
    return fallback;
  } catch {
    return fallback;
  }
}

async function syncServerCookieFromCurrentSession() {
  const { data } = await supabaseClient.auth.getSession();
  const session = data?.session;
  if (!session?.access_token || !session?.refresh_token) return;

  await fetch('/api/auth/sync', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    }),
    // no-cache to avoid any proxy weirdness
    cache: 'no-store',
  }).catch(() => {});
}

async function syncServerCookieFromTokens(access_token: string, refresh_token: string) {
  await fetch('/api/auth/sync', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ access_token, refresh_token }),
    cache: 'no-store',
  }).catch(() => {});
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [message, setMessage] = useState('Signing you in…');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const paramNext = search.get('next');
        const code = search.get('code');

        if (code) {
          // PKCE: finish exchange in the browser
          const { error } = await supabaseClient.auth.exchangeCodeForSession(code);
          if (error) throw error;

          // Sync to server cookie
          await syncServerCookieFromCurrentSession();

          const dest =
            paramNext && paramNext !== '/' ? paramNext : await resolveRoleDefault();
          if (!cancelled) router.replace(dest);
          return;
        }

        // Hash tokens flow
        const hashParams = parseHashParams(window.location.hash);
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');

        if (access_token && refresh_token) {
          // Set in browser
          const { error } = await supabaseClient.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) throw error;

          // Sync to server cookie
          await syncServerCookieFromTokens(access_token, refresh_token);

          const dest =
            paramNext && paramNext !== '/' ? paramNext : await resolveRoleDefault();
          if (!cancelled) router.replace(dest);
          return;
        }

        // Neither flow present → back to sign-in
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
