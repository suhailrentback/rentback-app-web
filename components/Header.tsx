// components/Header.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Brand } from './Brand';

type Theme = 'light' | 'dark';
type Lang = 'en' | 'ur';

const copy: Record<Lang, { founder: string; signIn: string; light: string; dark: string }> = {
  en: { founder: 'Founder', signIn: 'Sign in', light: 'Light', dark: 'Dark' },
  ur: { founder: 'بانی', signIn: 'سائن اِن', light: 'لائٹ', dark: 'ڈارک' },
};

export default function Header() {
  const [theme, setTheme] = useState<Theme>('light');
  const [lang, setLang] = useState<Lang>('en');

  // hydrate from localStorage once
  useEffect(() => {
    try {
      const t = localStorage.getItem('rb-theme');
      const l = localStorage.getItem('rb-lang');
      if (t === 'light' || t === 'dark') setTheme(t);
      if (l === 'en' || l === 'ur') setLang(l);
    } catch {}
  }, []);

  // apply to <html> (dark class, lang, dir); persist
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ur' ? 'rtl' : 'ltr');
    if (theme === 'dark') html.classList.add('dark');
    else html.classList.remove('dark');
    try {
      localStorage.setItem('rb-theme', theme);
      localStorage.setItem('rb-lang', lang);
    } catch {}
  }, [theme, lang]);

  const t = copy[lang];

  return (
    <header className="sticky top-0 z-30 border-b border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/30 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Brand />
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/founder"
            className="px-3 py-2 text-sm rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
          >
            {t.founder}
          </Link>

          <button
            onClick={() => setLang((p) => (p === 'en' ? 'ur' : 'en'))}
            className="px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="toggle language"
          >
            {lang === 'en' ? 'اردو' : 'English'}
          </button>

          <button
            onClick={() => setTheme((p) => (p === 'dark' ? 'light' : 'dark'))}
            className="px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="toggle theme"
          >
            {theme === 'dark' ? t.light : t.dark}
          </button>

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
