// WEB: place in rentback-app-web/components/ThemeLangToggle.tsx
"use client";
import { useEffect, useState } from "react";

type Lang = "en" | "ur";
type Theme = "light" | "dark";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000`;
}

export default function ThemeLangToggle(props: { initialLang?: Lang; initialTheme?: Theme }) {
  const [lang, setLang] = useState<Lang>(props.initialLang ?? "en");
  const [theme, setTheme] = useState<Theme>(props.initialTheme ?? "light");

  useEffect(() => {
    // Hydrate from cookies on the client if not provided
    if (!props.initialLang) {
      const m = document.cookie.match(/(?:^|;\s*)rb_lang=(en|ur)/);
      if (m?.[1] === "ur" || m?.[1] === "en") setLang(m[1] as Lang);
    }
    if (!props.initialTheme) {
      const m = document.cookie.match(/(?:^|;\s*)rb_theme=(light|dark)/);
      if (m?.[1] === "dark" || m?.[1] === "light") setTheme(m[1] as Theme);
    }
  }, [props.initialLang, props.initialTheme]);

  const toggleLang = () => {
    const next = lang === "en" ? "ur" : "en";
    setLang(next);
    setCookie("rb_lang", next);
    // immediate UX update for dir; SSR will also reflect after reload
    document.documentElement.setAttribute("lang", next);
    document.documentElement.setAttribute("dir", next === "ur" ? "rtl" : "ltr");
    location.reload();
  };

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    setCookie("rb_theme", next);
    // immediate UX update; SSR will reflect after reload
    document.documentElement.classList.toggle("dark", next === "dark");
    location.reload();
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={toggleLang}
        className="px-3 py-2 text-sm rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
        aria-label="Toggle language"
      >
        {lang === "en" ? "اردو" : "English"}
      </button>
      <button
        type="button"
        onClick={toggleTheme}
        className="px-3 py-2 text-sm rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
        aria-label="Toggle theme"
      >
        {theme === "light" ? "Dark" : "Light"}
      </button>
    </div>
  );
}
