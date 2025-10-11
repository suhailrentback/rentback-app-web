// components/Header.tsx
import Link from 'next/link';
import { supabaseServer } from '../lib/supabase/server';
import Brand from './Brand';

export const dynamic = 'force-dynamic';

export default async function Header() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-30 border-b border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/30 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2">
          <Brand />
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          <Link href="/founder" className="px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
            Founder
          </Link>
          {user ? (
            <>
              <span className="opacity-70 hidden sm:inline">{user.email}</span>
              <Link
                href="/sign-out"
                className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Sign out
              </Link>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
