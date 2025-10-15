// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

import { I18nProvider } from "@/lib/i18n";
import { getDirForLang, getLangFromCookies } from "@/lib/i18n/server";
import FloatingLangSwitch from "@/components/FloatingLangSwitch";

export const metadata: Metadata = {
  title: "RentBack",
  description: "Pay rent, earn rewards — with receipts and role-based access.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const initialLang = getLangFromCookies();
  const dir = getDirForLang(initialLang);

  return (
    <html lang={initialLang} dir={dir} suppressHydrationWarning>
      <body className="bg-white text-gray-900 antialiased">
        <I18nProvider initialLang={initialLang}>
          {children}
          <FloatingLangSwitch />
        </I18nProvider>
      </body>
    </html>
  );
}
