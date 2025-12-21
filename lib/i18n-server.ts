// lib/i18n-server.ts
import { cookies } from "next/headers";
import {
  LANG_COOKIE,
  THEME_COOKIE,
  normalizeLang,
  normalizeTheme,
  type Lang,
  type Theme,
} from "./i18n";

export function getLangFromCookies(): Lang {
  const v = cookies().get(LANG_COOKIE)?.value ?? null;
  return normalizeLang(v);
}

export function getThemeFromCookies(): Theme {
  const v = cookies().get(THEME_COOKIE)?.value ?? null;
  return normalizeTheme(v);
}
