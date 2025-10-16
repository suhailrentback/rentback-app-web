// app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { roleToHome, type Role } from '@/lib/auth/roles';

function getHashParams(): URLSearchParams {
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  const raw = hash && hash.startsWith('#') ? hash.slice(1) : hash || '';
  return new URLSearchParams(raw);
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const search = useSearchParams();

  useEffect(() => {
    const run = async () => {
      const supabase = getSupabaseBrowser();

      // 1) If the magic link carries tokens in the hash, set the session.
      try {
        const hash = getHashParams();
        const access_token = hash.get('access_token');
        const refresh_token = hash.get('refresh_token');

        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
        } else {
          // Some flows come back with ?code=... (PKCE); attempt exchange if present
          const code = search.get('code');
          if (code) {
            await supabase.auth.exchangeCodeForSession(code);
          }
        }
      } catch {
        // ignore; we'll fall back to getSession
      }

      // 2) Ensure we actually have a session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace('/sign-in?error=missing_session');
        return;
      }

      // 3) Sync profile + role cookie on the server
      let role: Role = 'tenant';
      try {
        const r = await fetch('/api/auth/sync', { method: 'POST' });
        if (r.ok) {
          const json = await r.json();
          role = json.role || 'tenant';
        }
      } catch {
        // ignore; fallback stays 'tenant'
      }

      // 4) Compute destination
      const nextParam = search.get('next');
      const dest = nextParam || roleToHome(role);

      // 5) Hard redirect to final destination
      window.location.replace(dest);
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-[60vh] grid place-items-center px-6">
      <div className="text-center">
        <div className="mb-3 text-sm text-gray-500">Signing you in…</div>
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    </main>
  );
}
