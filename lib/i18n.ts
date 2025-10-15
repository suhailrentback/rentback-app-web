// lib/i18n.ts
// Public barrel for client-side i18n pieces.
// IMPORTANT: Do NOT re-export server helpers here.

export { I18nProvider, useI18n } from "./i18n/index";
export type { Lang } from "./i18n/shared";
export { LANG_COOKIE, dirForLang } from "./i18n/shared";
