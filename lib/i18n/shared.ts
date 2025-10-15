// lib/i18n/shared.ts
export type Lang = "en" | "ur";
export type Theme = "light" | "dark" | "system";

export const LANG_COOKIE = "rb_lang";
export const THEME_COOKIE = "rb_theme";

export function dirForLang(lang: Lang): "ltr" | "rtl" {
  return lang === "ur" ? "rtl" : "ltr";
}

export function normalizeTheme(t?: string | null): Theme {
  return t === "dark" || t === "light" || t === "system" ? t : "light";
}
