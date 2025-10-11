// app/page.tsx
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getSessionUser } from '@/lib/auth/session';

export default async function Home() {
  const user = await getSessionUser();

  return (
    <section className="py-10">
      <h1 className="text-3xl font-extrabold">Welcome to RentBack</h1>
      <p className="mt-2 opacity-80">
        A modern rent-payments experience — Raast, cards & wallets, and local rewards.
      </p>

      <div className="mt-6 rounded-2xl border border-black/10 dark:border-white/10 p-5">
        {user ? (
          <>
            <div className="text-sm">You’re signed in as <b>{user.email}</b>.</div>
            <div className="mt-4 flex gap-3">
              <Link href="/tenant" className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">
                Go to Tenant Dashboard (stub)
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  Sign out
                </button>
              </form>
            </div>
          </>
        ) : (
          <>
            <div className="text-sm">You’re not signed in.</div>
            <div className="mt-4 flex gap-3">
              <Link href="/sign-in?next=/" className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">
                Sign in
              </Link>
              <Link href="/demo" className="px-4 py-2 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10">
                Continue in Demo Mode
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
