// lib/i18n/server.ts
import { cookies } from "next/headers";
import type { Lang, Theme } from "./shared";
import { LANG_COOKIE, THEME_COOKIE, dirForLang, normalizeTheme } from "./shared";

/**
 * Server-only helpers. Do NOT import this file from client components.
 */

export function getLangFromCookies(): Lang {
  const v = cookies().get(LANG_COOKIE)?.value;
  return v === "ur" ? "ur" : "en";
}

export function getDirForLang(lang: Lang): "ltr" | "rtl" {
  return dirForLang(lang);
}

export function getThemeFromCookies(): Theme {
  const v = cookies().get(THEME_COOKIE)?.value ?? null;
  return normalizeTheme(v);
}

export { LANG_COOKIE, THEME_COOKIE, type Lang, type Theme };
