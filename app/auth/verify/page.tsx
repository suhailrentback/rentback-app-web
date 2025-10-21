"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyPage() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
      <p className="mt-2 text-sm text-gray-600">
        We sent a verification link{email ? ` to ${email}` : ""}. Click it to confirm your account,
        then you’ll be redirected back here and into your dashboard.
      </p>

      <div className="mt-6 space-y-3">
        <Link href="/sign-in" className="underline text-sm">
          Back to sign in
        </Link>
        <div className="text-xs text-gray-500">
          Didn’t get it? Check spam/promotions, or try again in a minute.
        </div>
      </div>
    </div>
  );
}
