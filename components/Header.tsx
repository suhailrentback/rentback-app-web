// components/Header.tsx
// SERVER COMPONENT — safe to import server helpers here.

import Link from "next/link";
import Brand from "./Brand";
import ThemeLangToggle from "./ThemeLangToggle";
import AuthButton from "./AuthButton";

import { getLangFromCookies } from "@/lib/i18n/server";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function Header() {
  // Read language from cookies on the server (no client hook here)
  const lang = getLangFromCookies();

  // Session (server-side) so we can render AuthButton appropriately
  const supabase = createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const email = session?.user?.email ?? null;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" aria-label="RentBack home" className="inline-flex items-center gap-2">
          <Brand />
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-gray-700 md:flex">
          <Link className="hover:text-emerald-700" href="/tenant">
            Tenant
          </Link>
          <Link className="hover:text-emerald-700" href="/landlord">
            Landlord
          </Link>
          <Link className="hover:text-emerald-700" href="/tenant/rewards">
            Rewards
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {/* Client component reads context; no props required */}
          <ThemeLangToggle />

          {/* Auth control: only render AuthButton when logged in, else show Sign in */}
          {email ? (
            <AuthButton email={email} />
          ) : (
            <Link
              href="/sign-in"
              className="rounded-full border border-emerald-700/15 bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>

      {/* Screen-reader hint for current language */}
      <span className="sr-only">Language: {lang}</span>
    </header>
  );
}
