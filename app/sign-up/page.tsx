"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/email-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pw }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Sign up failed");
      // Go to “verify your email” screen
      router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="text-sm text-gray-500 mt-1">
        Use your email and a password (min 8 chars). We’ll send a verification link.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Password</label>
          <div className="mt-1 flex">
            <input
              required
              type={showPw ? "text" : "password"}
              value={pw}
              onChange={(e) => setPw(e.currentTarget.value)}
              className="w-full rounded-l-lg border px-3 py-2"
              placeholder="••••••••"
              autoComplete="new-password"
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="rounded-r-lg border border-l-0 px-3 text-sm"
              aria-label="Toggle password visibility"
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Minimum 8 characters.</p>
        </div>

        {err && (
          <p className="text-sm text-red-600">
            {err}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-sm">
        Already have an account?{" "}
        <Link href="/sign-in" className="underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
