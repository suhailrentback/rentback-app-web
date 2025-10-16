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
          await supabase.auth.setSession({ access_token, refresh_token });
        } else if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }

        // 🔄 Ensure profile exists with a default role = 'tenant'
        await fetch('/api/auth/sync', { method: 'POST', cache: 'no-store' }).catch(() => {});
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
