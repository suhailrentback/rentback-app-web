import './globals.css';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'RentBack',
  description: 'Pay rent, earn rewards — Pakistan-first rent platform.',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 antialiased">
        <Header />
        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
