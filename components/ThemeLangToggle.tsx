// components/ThemeLangToggle.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export default function ThemeLangToggle() {
  const router = useRouter();
  const [pending, start] = React.useTransition();

  const currentLang = () =>
    document.documentElement.getAttribute("lang") === "ur" ? "ur" : "en";
  const currentTheme = () =>
    document.documentElement.classList.contains("dark") ? "dark" : "light";

  const toggleLang = () =>
    start(async () => {
      await fetch("/api/prefs/lang", { method: "POST" });
      router.refresh();
    });

  const toggleTheme = () =>
    start(async () => {
      await fetch("/api/prefs/theme", { method: "POST" });
      router.refresh();
    });

  const lang = currentLang();
  const theme = currentTheme();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleLang}
        disabled={pending}
        className="px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
        aria-label="toggle language"
      >
        {lang === "en" ? "اردو" : "English"}
      </button>
      <button
        onClick={toggleTheme}
        disabled={pending}
        className="px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
        aria-label="toggle theme"
      >
        {theme === "dark" ? (lang === "ur" ? "لائٹ" : "Light") : (lang === "ur" ? "ڈارک" : "Dark")}
      </button>
    </div>
  );
}
