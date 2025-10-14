// lib/i18n/dictionaries.ts
export type Locale = 'en' | 'ur';

export const dictionaries: Record<Locale, Record<string, string>> = {
  en: {
    'lang.label': 'Language',
    'lang.en': 'English',
    'lang.ur': 'Urdu',
    'lang.switchToEnglish': 'Switch to English',
    'lang.switchToUrdu': 'Switch to Urdu',
    'a11y.skip': 'Skip to main content',
  },
  ur: {
    'lang.label': 'زبان',
    'lang.en': 'انگریزی',
    'lang.ur': 'اردو',
    'lang.switchToEnglish': 'انگریزی پر جائیں',
    'lang.switchToUrdu': 'اردو پر جائیں',
    'a11y.skip': 'مرکزی مواد پر جائیں',
  },
};
