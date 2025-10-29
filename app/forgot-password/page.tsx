// app/forgot-password/page.tsx
"use client";

import React, { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErr(null);
    try {
      const supabase = getSupabaseBrowser();
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) {
        setErr(error.message);
        setStatus("error");
        return;
      }
      setStatus("sent");
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold">Forgot password</h1>
      <p className="mt-2 text-sm text-gray-600">
        Enter your email and we’ll send a reset link.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        {err ? (
          <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {status === "sending" ? "Sending…" : "Send reset link"}
        </button>
      </form>

      {status === "sent" ? (
        <div className="mt-4 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
          Check your email for the reset link. It will open a page here to set a new password.
        </div>
      ) : null}

      <div className="mt-4 text-sm">
        Remembered it?{" "}
        <a href="/sign-in" className="underline">
          Back to sign in
        </a>
        .
      </div>
    </div>
  );
}
