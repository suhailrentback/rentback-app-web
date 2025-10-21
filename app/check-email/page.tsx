// app/check-email/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
// ⬇️ changed: import from client-only module
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function CheckEmailPage() {
  const params = useSearchParams();
  const email = params.get("email") || "";

  const [status, setStatus] = useState<"idle" | "resending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const domainHref = useMemo(() => {
    const domain = email.split("@")[1]?.toLowerCase() || "";
    if (domain.includes("gmail")) return "https://mail.google.com";
    if (domain.includes("outlook") || domain.includes("hotmail") || domain.includes("live"))
      return "https://outlook.live.com/mail";
    if (domain.includes("yahoo")) return "https://mail.yahoo.com";
    return domain ? `https://www.${domain}` : "https://mail.google.com";
  }, [email]);

  async function handleResend() {
    if (!email) return;
    setStatus("resending");
    setMessage(null);
    try {
      const supabase = getSupabaseBrowser();
      // @ts-expect-error — .resend may not exist in older supabase-js, guarded by try/catch.
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) {
        setStatus("error");
        setMessage(error.message || "Could not resend verification email.");
        return;
      }
      setStatus("sent");
      setMessage("Verification email resent. Check your inbox (and spam).");
    } catch (e: any) {
      setStatus("error");
      setMessage(e?.message || "Resend not available. Try again shortly.");
    }
  }

  useEffect(() => {
    if (!email) {
      setMessage("We sent a confirmation email to your address. Please check your inbox.");
    }
  }, [email]);

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold">Check your email</h1>
      <p className="mt-3 text-gray-700">
        We’ve sent a verification link
        {email ? <> to <span className="font-medium">{email}</span></> : null}. Click the link in that email to verify your account.
      </p>

      <div className="mt-6 space-y-3">
        <a
          href={domainHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-full items-center justify-center rounded-xl border px-4 py-2 hover:bg-gray-50"
        >
          Open your mailbox
        </a>

        <button
          onClick={handleResend}
          disabled={!email || status === "resending"}
          className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {status === "resending" ? "Resending…" : "Resend verification email"}
        </button>

        <div className="text-sm text-gray-600">
          Didn’t get it? Check your spam folder or{" "}
          <Link href="/sign-up" className="text-blue-600 hover:underline">
            try a different email
          </Link>
          .
        </div>
      </div>

      {message ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {message}
        </div>
      ) : null}

      <p className="mt-8 text-sm text-gray-600">
        Already verified?{" "}
        <Link href="/sign-in" className="text-blue-600 hover:underline">
          Sign in
        </Link>
        .
      </p>
    </main>
  );
}
