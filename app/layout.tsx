// app/layout.tsx
import type { Metadata } from 'next';
import { getLangFromCookies } from '@/lib/i18n/server';
import { I18nProvider, useI18n } from '@/lib/i18n/index';
import FloatingLangSwitch from '@/components/FloatingLangSwitch';

export const metadata: Metadata = {
  title: 'RentBack',
  description: 'RentBack',
};

function SkipLink() {
  const { t } = useI18n();
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:shadow"
    >
      {t('a11y.skip')}
    </a>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = getLangFromCookies();
  const dir = lang === 'ur' ? 'rtl' : 'ltr';

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body>
        {/* Global a11y styles: focus ring + reduced motion */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :focus-visible { outline: 2px solid #10b981; outline-offset: 2px; }
              @media (prefers-reduced-motion: reduce) {
                *, *::before, *::after { animation: none !important; transition: none !important; }
              }
            `,
          }}
        />
        <I18nProvider initialLang={lang}>
          <SkipLink />
          <FloatingLangSwitch />
          <main id="main" role="main">{children}</main>
        </I18nProvider>
      </body>
    </html>
  );
}
