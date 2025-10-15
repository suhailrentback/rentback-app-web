// lib/i18n/index.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Lang } from "./shared";
import { LANG_COOKIE, dirForLang } from "./shared";

/**
 * Minimal client-side i18n with a tiny translator: t(key, vars)
 * - Safe defaults (no deps)
 * - EN/UR dictionaries with fallback to EN, then the key
 * - Keeps <html lang/dir> and cookie in sync
 */

// ---- Dictionaries (add keys over time; unknown keys fall back to EN, then the key itself)
const DICT: Record<Lang, Record<string, string>> = {
  en: {
    "common.sign_in": "Sign in",
    "common.get_started": "Get started",
    "common.view_rewards": "View rewards",
    "rewards.title": "Rewards",
    "rewards.balance": "Balance",
    "rewards.offers": "Offers",
    "rewards.history": "Redemption history",
  },
  ur: {
    "common.sign_in": "سائن اِن",
    "common.get_started": "شروع کریں",
    "common.view_rewards": "انعامات دیکھیں",
    "rewards.title": "انعامات",
    "rewards.balance": "بیلنس",
    "rewards.offers": "آفرز",
    "rewards.history": "ریڈیمپشن ہسٹری",
  },
};

function format(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

function makeTranslator(lang: Lang) {
  return (key: string, vars?: Record<string, string | number>) => {
    const base = DICT[lang]?.[key] ?? DICT.en?.[key] ?? key;
    return format(base, vars);
  };
}

// ---- Context
type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  dir: "ltr" | "rtl";
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nCtx = createContext<Ctx>({
  lang: "en",
  setLang: () => {},
  dir: "ltr",
  t: (key: string) => key,
});

export function I18nProvider({
  children,
  initialLang = "en",
}: {
  children: React.ReactNode;
  initialLang?: Lang;
}) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const dir = dirForLang(lang);
  const t = useMemo(() => makeTranslator(lang), [lang]);

  // Keep <html> in sync + persist cookie
  useEffect(() => {
    try {
      document.documentElement.lang = lang;
      document.documentElement.dir = dir;
      document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
    } catch {}
  }, [lang, dir]);

  const value = useMemo(() => ({ lang, setLang, dir, t }), [lang, dir, t]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  return useContext(I18nCtx);
}
