// components/ThemeLangToggle.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Lang = "en" | "ur";
type Theme = "light" | "dark";

export default function ThemeLangToggle({
  initialLang,
  initialTheme,
  compact = false,
}: {
  initialLang: Lang;
  initialTheme: Theme;
  compact?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lang, setLang] = useState<Lang>(initialLang);
  const [theme, setTheme] = useState<Theme>(initialTheme);

  async function update(partial: Partial<{ lang: Lang; theme: Theme }>) {
    const nextLang = partial.lang ?? lang;
    const nextTheme = partial.theme ?? theme;

    // Optimistic UI
    setLang(nextLang);
    setTheme(nextTheme);

    await fetch("/api/prefs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ lang: nextLang, theme: nextTheme }),
    });

    startTransition(() => router.refresh());
  }

  const pill =
    "px-2 py-1 text-xs rounded-md border border-black/10 dark:border-white/15";
  const active =
    "bg-black text-white dark:bg-white dark:text-black border-transparent";
  const inactive =
    "bg-transparent hover:bg-black/5 dark:hover:bg-white/10";

  return (
    <div className={compact ? "flex items-center gap-2" : "flex items-center gap-3"}>
      {/* Theme */}
      <div className="inline-flex items-center gap-1">
        <button
          type="button"
          className={`${pill} ${theme === "light" ? active : inactive}`}
          onClick={() => update({ theme: "light" })}
          aria-pressed={theme === "light"}
          disabled={isPending}
        >
          {lang === "ur" ? "لائٹ" : "Light"}
        </button>
        <button
          type="button"
          className={`${pill} ${theme === "dark" ? active : inactive}`}
          onClick={() => update({ theme: "dark" })}
          aria-pressed={theme === "dark"}
          disabled={isPending}
        >
          {lang === "ur" ? "ڈارک" : "Dark"}
        </button>
      </div>

      {/* Language */}
      <div className="inline-flex items-center gap-1">
        <button
          type="button"
          className={`${pill} ${lang === "en" ? active : inactive}`}
          onClick={() => update({ lang: "en" })}
          aria-pressed={lang === "en"}
          disabled={isPending}
        >
          EN
        </button>
        <button
          type="button"
          className={`${pill} ${lang === "ur" ? active : inactive}`}
          onClick={() => update({ lang: "ur" })}
          aria-pressed={lang === "ur"}
          disabled={isPending}
          dir="rtl"
        >
          اردو
        </button>
      </div>
    </div>
  );
}
