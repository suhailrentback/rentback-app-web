// lib/i18n/server.ts
import { cookies } from "next/headers";
import type { Lang } from "./shared";
import { LANG_COOKIE, dirForLang } from "./shared";

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

// Re-export types/constants for convenience in SERVER code only
export { LANG_COOKIE, type Lang };
