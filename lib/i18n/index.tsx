// lib/i18n/index.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Lang } from "./shared";
import { LANG_COOKIE, dirForLang } from "./shared";

/**
 * Client-side i18n context.
 * IMPORTANT: Do NOT import server.ts here (it uses next/headers).
 */

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  dir: "ltr" | "rtl";
};

const I18nCtx = createContext<Ctx>({ lang: "en", setLang: () => {}, dir: "ltr" });

export function I18nProvider({
  children,
  initialLang = "en",
}: {
  children: React.ReactNode;
  initialLang?: Lang;
}) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const dir = dirForLang(lang);

  // Keep <html> in sync + persist cookie
  useEffect(() => {
    try {
      document.documentElement.lang = lang;
      document.documentElement.dir = dir;
      document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
    } catch {}
  }, [lang, dir]);

  const value = useMemo(() => ({ lang, setLang, dir }), [lang, dir]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  return useContext(I18nCtx);
}
