// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Reads the URL hash returned by Supabase magic link, finalizes session
 * (handled by Supabase JS), calls /api/auth/sync to set rb_role cookie,
 * then hard-redirects to the right area.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    (async () => {
      try {
        // Make sure we hit the sync endpoint so role cookie is set
        await fetch("/api/auth/sync", { cache: "no-store" });

        // Prefer ?next=... from the URL, default to /tenant
        const next = sp.get("next") || "/tenant";

        // Hard redirect to ensure the new cookie is present on first SSR render
        window.location.assign(next);
      } catch {
        window.location.assign("/sign-in?error=callback_failed");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid min-h-[60vh] place-items-center px-6 py-20">
      <div className="text-center">
        <div className="text-sm font-medium text-emerald-700">Signing you in…</div>
        <div className="mt-2 text-xs text-gray-500">Just a moment.</div>
      </div>
    </div>
  );
}
