"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function parseHash(hash: string) {
  const raw = hash?.startsWith("#") ? hash.slice(1) : hash || "";
  const p = new URLSearchParams(raw);
  return {
    access_token: p.get("access_token") || undefined,
    refresh_token: p.get("refresh_token") || undefined,
    error: p.get("error") || undefined,
  };
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/tenant";
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { access_token, refresh_token, error } = parseHash(window.location.hash);

      // Handle OAuth "code" too, just in case
      const code = sp.get("code");

      try {
        if (error) throw new Error(error);

        if (access_token && refresh_token) {
          // 1) Create client session
          const { data, error: setErr } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (setErr) throw setErr;

          // 2) Sync to server cookies for SSR
          await fetch("/api/auth/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: "SIGNED_IN", session: data.session }),
            cache: "no-store",
          });
        } else if (code) {
          // Fallback for OAuth code flow
          const { error: exchErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchErr) throw exchErr;

          // Sync after exchange
          const { data } = await supabase.auth.getSession();
          await fetch("/api/auth/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: "SIGNED_IN", session: data.session }),
            cache: "no-store",
          });
        } else {
          throw new Error("Missing tokens");
        }

        // 3) Clean redirect
        router.replace(next);
      } catch (e: any) {
        setErr(e?.message ?? "Sign-in failed");
        router.replace(`/sign-in?next=${encodeURIComponent(next)}`);
      }
    })();
  }, [router, sp, next]);

  return (
    <div className="grid min-h-[60vh] place-items-center p-6">
      <div className="w-full max-w-sm rounded-xl border p-6 shadow-sm">
        <div className="text-sm font-medium">Signing you in…</div>
        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      </div>
    </div>
  );
}
