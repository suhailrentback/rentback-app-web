// app/sign-in/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase";

export default function SignInPage() {
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pw,
      });
      if (error) {
        setErr(error.message);
        setLoading(false);
        return;
      }

      // Ensure rb_role cookie is in sync, then route by role
      const res = await fetch("/api/auth/sync", { cache: "no-store" });
      let role = "tenant";
      try {
        const j = await res.json();
        if (j && typeof j.role === "string") role = j.role as string;
      } catch {
        // ignore parsing errors, default to tenant
      }

      const fallback =
        role === "admin" ? "/admin" : role === "landlord" ? "/landlord" : "/tenant";

      router.replace(next || fallback);
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong signing in.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="mt-2 text-sm text-gray-600">
        Access your RentBack dashboard.
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
            placeholder="Your password"
            autoComplete="current-password"
          />
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
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {/* Clear, visible path to sign up */}
      <div className="mt-4 text-sm">
        Don’t have an account?{" "}
        <a href="/sign-up" className="underline">
          Create one
        </a>
        .
      </div>
    </div>
  );
}
