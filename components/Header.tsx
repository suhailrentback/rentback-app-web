// components/Header.tsx
// Server component: reads session, shows email + Sign out (no brand changes)

import Link from "next/link";
import { cookies } from "next/headers";

import Brand from "./Brand";
import ThemeLangToggle from "./ThemeLangToggle";
import { getLang } from "../lib/i18n";
import { getTheme } from "../lib/theme";
import { createServerSupabase } from "../lib/supabase/server";
import AuthButton from "./AuthButton";

export default async function Header() {
  const lang = getLang();
  const theme = getTheme();

  // Session (server-side)
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? null;

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-white/70 dark:bg-neutral-950/60 border-b border-black/5 dark:border-white/10">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        {/* Brand stays exactly as you have it */}
        <Brand href="/" />

        {/* Right side controls: theme/lang + auth */}
        <nav className="flex items-center gap-2">
          <ThemeLangToggle initialLang={lang} initialTheme={theme} />
          {/* Auth UI (minimal) */}
          <AuthButton email={email} />
        </nav>
      </div>
    </header>
  );
}
