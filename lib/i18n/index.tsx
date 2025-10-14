// lib/i18n/index.tsx
'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { dictionaries, type Locale } from './dictionaries';

type Ctx = {
  lang: Locale;
  setLang: (v: Locale) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ initialLang, children }: { initialLang: Locale; children: React.ReactNode }) {
  const [lang, setLangState] = useState<Locale>(initialLang);

  const setLang = useCallback((v: Locale) => {
    setLangState(v);
    try {
      document.cookie = `rb_lang=${v};path=/;max-age=31536000;SameSite=Lax`;
      document.documentElement.setAttribute('dir', v === 'ur' ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', v);
    } catch { /* no-op */ }
  }, []);

  useEffect(() => {
    // On first mount, ensure SSR attributes are synced on the client as well.
    document.documentElement.setAttribute('dir', lang === 'ur' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const t = useCallback((key: string) => {
    return (dictionaries[lang] && dictionaries[lang][key]) || key;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
