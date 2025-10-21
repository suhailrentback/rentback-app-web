// app/sign-up/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
// ⬇️ changed: import from client-only module
import { getSupabaseBrowser } from "@/lib/supabase/client";

const formSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string().min(8, "Confirm your password"),
  })
  .refine((vals) => vals.password === vals.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

function scorePassword(pwd: string) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.min(4, Math.max(0, score - 1));
}
const labels = ["Weak", "Fair", "Good", "Strong", "Very strong"];

export default function SignUpPage() {
  const router = useRouter();
  const params = useSearchParams();
  const nextParam = params.get("next") || undefined;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const s = useMemo(() => scorePassword(password), [password]);
  const pct = ((s + 1) / 5) * 100;
  const strengthLabel = labels[s];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setInfo(null);

    const parsed = formSchema.safeParse({ email, password, confirm });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = getSupabaseBrowser();

      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        if (error.message?.toLowerCase().includes("already registered")) {
          setFormError("This email is already registered. Try signing in instead.");
        } else {
          setFormError(error.message || "Could not sign up.");
        }
        return;
      }

      if (!data.session) {
        router.replace(`/check-email?email=${encodeURIComponent(email)}`);
        return;
      }

      try {
        const res = await fetch("/api/auth/sync", { cache: "no-store" });
        const j = (await res.json()) as { role?: string | null };
        const role = (j.role || "tenant").toLowerCase();

        const target =
          nextParam ||
          (role === "landlord" ? "/landlord" : role === "staff" ? "/admin" : "/tenant");

        router.replace(target);
      } catch {
        router.replace(nextParam || "/tenant");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-2 text-sm text-gray-600">
        Already have one?{" "}
        <Link href="/sign-in" className="text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
          />
          <div className="mt-2">
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  background: s <= 1 ? "#f87171" : s === 2 ? "#fbbf24" : s === 3 ? "#34d399" : "#10b981",
                }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-600">Strength: {strengthLabel}</p>
          </div>
        </div>

        <div>
          <label htmlFor="confirm" className="block text-sm font-medium">
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter your password"
            required
          />
        </div>

        {formError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </div>
        ) : null}

        {info ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {info}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>

        <p className="text-xs text-gray-500">
          By continuing you agree to our Terms and acknowledge our Privacy Policy.
        </p>
      </form>
    </main>
  );
}
