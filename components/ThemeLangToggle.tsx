// components/ThemeLangToggle.tsx
"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { setLang, setTheme, type Lang, type Theme } from "@/lib/i18n";

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

  const flipLang = () => {
    const next = lang === "en" ? "ur" : "en";
    // optimistic UI
    setLangOpt(next);
    // instant DOM hint so layout/header match quickly
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", next);
      document.documentElement.setAttribute("dir", next === "ur" ? "rtl" : "ltr");
    }
    // persist + refresh
    startTransition(async () => {
      await setLang(next);
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
      await setTheme(next);
      router.refresh();
    });
  };

  const btnCls =
    "px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 " +
    "hover:bg-black/5 dark:hover:bg-white/10 text-sm disabled:opacity-50";

  return (
    <div className={compact ? "flex items-center gap-2" : "flex items-center gap-3"}>
      <button className={btnCls} onClick={flipLang} disabled={isPending} aria-live="polite">
        {lang === "en" ? "اردو" : "English"}
      </button>
      <button className={btnCls} onClick={flipTheme} disabled={isPending} aria-live="polite">
        {theme === "light" ? "Dark" : "Light"}
      </button>
    </div>
  );
}
