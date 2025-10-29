'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = getSupabaseBrowser();
        await supabase.auth.signOut();
        // Clear our role hint cookie (middleware guard)
        document.cookie = 'rb_role=; Max-Age=0; path=/';
      } catch (e) {
        // no-op
      } finally {
        router.replace('/sign-in');
      }
    };
    run();
  }, [router]);

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <p className="text-sm text-gray-600">Signing you out…</p>
    </div>
  );
}
