// app/sign-up/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase";

export default function SignUpPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "";

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const supabase = getSupabaseBrowser();
      const redirectTo = `${window.location.origin}/auth/callback${
        next ? `?next=${encodeURIComponent(next)}` : ""
      }`;

      const { error } = await supabase.auth.signUp({
        email,
        password: pw,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        setErr(error.message);
        setLoading(false);
        return;
      }

      // Send user to “Check your email” helper page
      router.replace(`/check-email?email=${encodeURIComponent(email)}`);
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong creating your account.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="mt-2 text-sm text-gray-600">
        Sign up to access your RentBack dashboard.
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

        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            required
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
          <div className="mt-2 text-xs">
            <a href="/forgot-password" className="underline">
              Forgot password?
            </a>
          </div>
        </div>

        {err ? (
          <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <div className="mt-4 text-sm">
        Already have an account?{" "}
        <a href={`/sign-in${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="underline">
          Sign in
        </a>
        .
      </div>
    </div>
  );
}
