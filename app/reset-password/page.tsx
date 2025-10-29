// app/reset-password/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [status, setStatus] = useState<"checking" | "ready" | "updating" | "done" | "error">("checking");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // Ensure user arrived via the magic link (valid session present)
    (async () => {
      try {
        const supabase = getSupabaseBrowser();
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setErr(
            "This page must be opened from the password reset link sent to your email. Please request a new link."
          );
          setStatus("error");
          return;
        }
        setStatus("ready");
      } catch (e: any) {
        setErr(e?.message ?? "Could not verify session.");
        setStatus("error");
      }
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (pw.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (pw !== pw2) {
      setErr("Passwords do not match.");
      return;
    }

    setStatus("updating");
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) {
        setErr(error.message);
        setStatus("error");
        return;
      }
      setStatus("done");
      // Small pause, then send to sign-in
      setTimeout(() => router.replace("/sign-in"), 800);
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong updating your password.");
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold">Set a new password</h1>
      <p className="mt-2 text-sm text-gray-600">
        Enter a strong password you’ll remember.
      </p>

      {status === "checking" ? (
        <div className="mt-6 text-sm text-gray-600">Checking your reset session…</div>
      ) : null}

      {status !== "checking" ? (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm mb-1">New password</label>
            <input
              type="password"
              required
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Confirm new password</label>
            <input
              type="password"
              required
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Re-enter new password"
              autoComplete="new-password"
            />
          </div>

          {err ? (
            <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={status === "updating" || status === "checking"}
            className="w-full rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {status === "updating" ? "Updating…" : "Update password"}
          </button>

          {status === "done" ? (
            <div className="mt-4 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
              Password updated. Redirecting to sign in…
            </div>
          ) : null}
        </form>
      ) : null}

      <div className="mt-4 text-sm">
        Don’t see a session?{" "}
        <a href="/forgot-password" className="underline">
          Request a new reset link
        </a>
        .
      </div>
    </div>
  );
}
