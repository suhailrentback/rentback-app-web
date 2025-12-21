// lib/i18n.ts
// Client-safe i18n helpers — do NOT import `next/headers` here.

export const LANG_COOKIE = "rb_lang";
export const THEME_COOKIE = "rb_theme";

export type Lang = "en" | "ur";
export type Theme = "light" | "dark";

export const MESSAGES: Record<Lang, Record<string, string>> = {
  en: {
    status_DRAFT: "Draft",
    status_ISSUED: "Issued",
    status_PAID: "Paid",
    status_OVERDUE: "Overdue",
  },
  ur: {
    status_DRAFT: "ڈرافٹ",
    status_ISSUED: "جاری",
    status_PAID: "ادا",
    status_OVERDUE: "تاخیر",
  },
};

export function t(lang: Lang | undefined, key: string, fallback?: string) {
  const L: Lang = lang === "ur" ? "ur" : "en";
  return (MESSAGES[L] as any)?.[key] ?? fallback ?? key;
}

export function normalizeLang(v: string | null | undefined): Lang {
  return v === "ur" ? "ur" : "en";
}

export function normalizeTheme(v: string | null | undefined): Theme {
  return v === "dark" ? "dark" : "light";
}
