// components/AuthButton.tsx
"use client";

import Link from "next/link";

export default function AuthButton({ email }: { email: string | null }) {
  if (!email) {
    // Not signed in
    return (
      <Link
        href="/sign-in"
        className="px-3 py-1.5 rounded-lg font-medium border border-neutral-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
      >
        Sign in
      </Link>
    );
  }

  // Signed in
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-neutral-600 dark:text-neutral-300 truncate max-w-[14rem]">
        {email}
      </span>
      <a
        href="/auth/signout"
        className="px-3 py-1.5 rounded-lg font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        Sign out
      </a>
    </div>
  );
}
