// components/FloatingLangSwitch.tsx
'use client';

import { useI18n } from '@/lib/i18n/index';

export default function FloatingLangSwitch() {
  const { lang, setLang, t } = useI18n();
  const toEN = () => setLang('en');
  const toUR = () => setLang('ur');

  return (
    <div className="fixed top-3 right-3 z-50 flex items-center gap-2 rounded-full border bg-white/80 backdrop-blur px-2 py-1 text-sm">
      <span className="sr-only">{t('lang.label')}</span>
      <button
        type="button"
        onClick={toEN}
        aria-label={t('lang.switchToEnglish')}
        className={`px-2 py-1 rounded ${lang === 'en' ? 'font-semibold underline' : ''} focus:outline-2 focus:outline-offset-2`}
      >
        EN
      </button>
      <span aria-hidden>•</span>
      <button
        type="button"
        onClick={toUR}
        aria-label={t('lang.switchToUrdu')}
        className={`px-2 py-1 rounded ${lang === 'ur' ? 'font-semibold underline' : ''} focus:outline-2 focus:outline-offset-2`}
      >
        اُردو
      </button>
    </div>
  );
}
