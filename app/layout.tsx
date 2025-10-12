// USE IN WEB REPO ONLY: rentback-app-web
// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getLang, getTheme, getDir } from "@/lib/i18n";

export const metadata: Metadata = { title: "RentBack" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang();
  const theme = getTheme();
  const dir = getDir(lang);

  return (
    <html lang={lang} dir={dir} className={theme === "dark" ? "dark" : undefined} suppressHydrationWarning>
      <body className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 antialiased">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
