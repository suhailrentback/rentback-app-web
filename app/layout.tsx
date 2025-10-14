// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { getLangFromCookies } from '@/lib/i18n/server';
import { I18nProvider } from '@/lib/i18n/index';
import FloatingLangSwitch from '@/components/FloatingLangSwitch';
import SkipLink from '@/components/SkipLink';

export const metadata: Metadata = {
  title: 'RentBack',
  description: 'RentBack',
};

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
