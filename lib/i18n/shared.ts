// lib/i18n/shared.ts
export type Lang = "en" | "ur";
export const LANG_COOKIE = "rb_lang";

export function dirForLang(lang: Lang): "ltr" | "rtl" {
  return lang === "ur" ? "rtl" : "ltr";
}
