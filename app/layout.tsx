// app/layout.tsx
import type { Metadata } from 'next';
import { getLangFromCookies } from '@/lib/i18n/server';
import { I18nProvider } from '@/lib/i18n';
import FloatingLangSwitch from '@/components/FloatingLangSwitch';

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
        {/* A11y: Skip link */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:shadow"
        >
          {/* Using EN text; the link is visible only when focused. */}
          Skip to main content
        </a>

        {/* Global focus ring (in case Tailwind focus styles are minimal) */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :focus-visible { outline: 2px solid #10b981; outline-offset: 2px; }
            `,
          }}
        />

        <I18nProvider initialLang={lang}>
          <FloatingLangSwitch />
          <main id="main">{children}</main>
        </I18nProvider>
      </body>
    </html>
  );
}
