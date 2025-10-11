// components/Header.tsx (server component)
import Link from "next/link";
import { cookies } from "next/headers";
import ThemeLangToggle from "@/components/ThemeLangToggle";
import { getLang, getCopy } from "@/lib/i18n";
import { Brand } from "@/components/Brand";

export default function Header() {
  // reading cookies here marks the route dynamic at build-time, which is okay
  cookies();
  const lang = getLang();
  const t = getCopy(lang).common;

  return (
    <header className="sticky top-0 z-30 border-b border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/30 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <Brand />
        <nav className="flex items-center gap-2">
          <Link href="/founder" className="px-3 py-2 text-sm rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
            {t.founder}
          </Link>
          <ThemeLangToggle />
          <Link
            href="/sign-in"
            className="px-3 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {t.signIn}
          </Link>
        </nav>
      </div>
    </header>
  );
}
