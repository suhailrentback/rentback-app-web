// components/Header.tsx
import Link from 'next/link';
import { Brand } from '@/components/Brand';
import { getSessionUser } from '@/lib/auth/session';

export default async function Header() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-30 border-b border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/30 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Brand />
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          <Link href="/founder" className="px-3 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
            Founder
          </Link>

          {user ? (
            <form action="/auth/signout" method="post" className="flex items-center gap-2">
              <span className="hidden sm:inline opacity-70">{user.email}</span>
              <button
                type="submit"
                className="px-3 py-1 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
              >
                Sign out
              </button>
            </form>
          ) : (
            <Link
              href="/sign-in?next=/"
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
