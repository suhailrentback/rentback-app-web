// app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const search = useSearchParams();
  const supabase = getSupabaseBrowser();

  useEffect(() => {
    const next = search.get('next') || '/tenant';

    (async () => {
      const hash = typeof window !== 'undefined' ? window.location.hash || '' : '';
      const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);

      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      const code = search.get('code');

      try {
        if (access_token && refresh_token) {
          // Magic link with tokens in hash
          await supabase.auth.setSession({ access_token, refresh_token });
        } else if (code) {
          // OAuth/code flow fallback
          await supabase.auth.exchangeCodeForSession(code);
        }
      } catch {
        // no-op; we'll land on sign-in if session didn’t stick
      } finally {
        router.replace(next);
      }
    })();
  }, [search, router, supabase]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <p className="text-sm text-gray-600">Signing you in…</p>
    </div>
  );
}
