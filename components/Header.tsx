// REPLACE FILE IN WEB REPO: /components/Header.tsx

import Link from "next/link";
import Brand from "@/components/Brand";
import ThemeLangToggle from "@/components/ThemeLangToggle";
import { getLang, getTheme, getCopy } from "@/lib/i18n"; // server-side helpers

export default async function Header() {
  const lang = getLang();
  const theme = getTheme();
  const t = getCopy(lang).common; // must have at least t.signIn

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-white/70 dark:bg-neutral-950/60 border-b border-black/5 dark:border-white/10">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Brand href="/" />
        <nav className="flex items-center gap-2">
          <ThemeLangToggle initialLang={lang} initialTheme={theme} />
          <Link
            href="/sign-in"
            className="px-3 py-2 text-sm rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
          >
            {t.signIn}
          </Link>
        </nav>
      </div>
    </header>
  );
}
