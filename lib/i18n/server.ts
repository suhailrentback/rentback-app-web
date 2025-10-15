// lib/i18n/server.ts
import { cookies } from "next/headers";

export type Lang = "en" | "ur";
export const LANG_COOKIE = "rb_lang";

export function getLangFromCookies(): Lang {
  const v = cookies().get(LANG_COOKIE)?.value;
  return v === "ur" ? "ur" : "en";
}

export function getDirForLang(lang: Lang): "ltr" | "rtl" {
  return lang === "ur" ? "rtl" : "ltr";
}
