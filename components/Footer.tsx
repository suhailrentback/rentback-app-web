// WEB: place in rentback-app-web/components/Footer.tsx
import Link from "next/link";
import { getLang, getCopy } from "@/lib/i18n";

export default function Footer() {
  const lang = getLang();
  const t = getCopy(lang).common;

  return (
    <footer className="border-t border-black/5 dark:border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>© 2025 RentBack Technologies (Pvt) Ltd</div>
        <nav className="flex items-center gap-5">
          <Link href="/privacy" className="hover:underline">{t.privacy}</Link>
          <Link href="/terms" className="hover:underline">{t.terms}</Link>
          <a href="mailto:help@rentback.app" className="hover:underline">{t.contact}</a>
        </nav>
      </div>
    </footer>
  );
}
