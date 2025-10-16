// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const search = useSearchParams();

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      // Touch session so Supabase sets/refreshes cookies on the client
      await supabase.auth.getSession();

      const next = search.get("next") || "/tenant";
      router.replace(next);
    })();
  }, [router, search]);

  return (
    <div className="p-6 text-sm text-gray-600">
      Signing you in…
    </div>
  );
}
