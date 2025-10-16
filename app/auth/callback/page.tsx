"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function parseHashParams(hash: string) {
  const raw = hash?.startsWith("#") ? hash.slice(1) : hash || "";
  return new URLSearchParams(raw);
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const qs = useSearchParams();

  useEffect(() => {
    const params = parseHashParams(window.location.hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    const next = qs.get("next") || "/tenant";

    if (access_token && refresh_token) {
      fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ access_token, refresh_token }),
      })
        .then(() => router.replace(next))
        .catch(() => router.replace("/sign-in?error=sync_failed"));
    } else {
      router.replace("/sign-in?error=missing_tokens");
    }
  }, [router, qs]);

  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="text-center text-sm text-gray-500">Signing you in…</div>
    </div>
  );
}
