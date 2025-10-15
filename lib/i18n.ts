// lib/i18n.ts
// Public barrel for client-side i18n pieces and shared types/constants.
// IMPORTANT: Do NOT re-export server helpers here.

export { I18nProvider, useI18n } from "./i18n/index";
export type { Lang, Theme } from "./i18n/shared";
export { LANG_COOKIE, THEME_COOKIE, dirForLang, normalizeTheme } from "./i18n/shared";
