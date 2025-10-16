'use client';

/**
 * app/auth/callback/page.tsx
 * Handles both Supabase flows:
 *   1) ?code=... (PKCE)  -> exchangeCodeForSession
 *   2) #access_token=...&refresh_token=... (implicit) -> setSession
 * Redirects to ?next=... if present, else role-aware default: /tenant or /landlord.
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/client';

function parseHashParams(hash: string): URLSearchParams {
  const raw = hash?.startsWith('#') ? hash.slice(1) : hash || '';
  return new URLSearchParams(raw);
}

async function resolveRoleDefault(): Promise<string> {
  // Default destination if we can’t read a role
  let fallback = '/tenant';

  try {
    const { data: userRes } = await supabaseClient.auth.getUser();
    const user = userRes?.user;
    if (!user) return fallback;

    // Try read role from your profile table (public.profile with user_id, role)
    const { data: profile } = await supabaseClient
      .from('profile')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const role = profile?.role?.toUpperCase?.();
    if (role === 'LANDLORD') return '/landlord';
    if (role === 'TENANT') return '/tenant';
    // STAFF/ADMIN don’t use this app’s domain; keep them out of here.
    return fallback;
  } catch {
    return fallback;
  }
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [message, setMessage] = useState('Signing you in…');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const paramNext = search.get('next'); // may be '/', '', or null
        const code = search.get('code');

        if (code) {
          const { error } = await supabaseClient.auth.exchangeCodeForSession(code);
          if (error) throw error;

          const dest =
            paramNext && paramNext !== '/' ? paramNext : await resolveRoleDefault();

          if (!cancelled) router.replace(dest);
          return;
        }

        // Implicit hash tokens
        const hashParams = parseHashParams(window.location.hash);
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');

        if (access_token && refresh_token) {
          const { error } = await supabaseClient.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) throw error;

          const dest =
            paramNext && paramNext !== '/' ? paramNext : await resolveRoleDefault();

          if (!cancelled) router.replace(dest);
          return;
        }

        // Neither flow present → bounce to sign-in
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
