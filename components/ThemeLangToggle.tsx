// USE IN BOTH REPOS: rentback-app-web AND rentback-admin-web
// components/ThemeLangToggle.tsx
"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import type { Lang, Theme } from "@/lib/i18n";

type Props = {
  initialLang: Lang;
  initialTheme: Theme;
  compact?: boolean;
};

export default function ThemeLangToggle({ initialLang, initialTheme, compact }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [lang, setLangOpt] = useOptimistic<Lang>(initialLang);
  const [theme, setThemeOpt] = useOptimistic<Theme>(initialTheme);

  const savePrefs = async (data: Partial<{ lang: Lang; theme: Theme }>) => {
    await fetch("/api/prefs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  const flipLang = () => {
    const next = lang === "en" ? "ur" : "en";
    setLangOpt(next);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", next);
      document.documentElement.setAttribute("dir", next === "ur" ? "rtl" : "ltr");
    }
    startTransition(async () => {
      await savePrefs({ lang: next });
      router.refresh();
    });
  };

  const flipTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setThemeOpt(next);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", next === "dark");
    }
    startTransition(async () => {
      await savePrefs({ theme: next });
      router.refresh();
    });
  };

  const btn =
    "px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 " +
    "hover:bg-black/5 dark:hover:bg-white/10 text-sm disabled:opacity-50";

  return (
    <div className={compact ? "flex items-center gap-2" : "flex items-center gap-3"}>
      <button className={btn} onClick={flipLang} disabled={isPending}>
        {lang === "en" ? "اردو" : "English"}
      </button>
      <button className={btn} onClick={flipTheme} disabled={isPending}>
        {theme === "light" ? "Dark" : "Light"}
      </button>
    </div>
  );
}
