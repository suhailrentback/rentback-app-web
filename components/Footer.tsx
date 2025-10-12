// USE IN BOTH REPOS: rentback-app-web AND rentback-admin-web
// components/Footer.tsx
import { getLang, getCopy } from "@/lib/i18n";

export default function Footer() {
  const lang = getLang();
  const t = getCopy(lang).common;

  return (
    <footer className="mt-16 border-t border-black/10 dark:border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm flex flex-wrap items-center gap-4 justify-between">
        <div>© 2025 RentBack Technologies (Pvt) Ltd</div>
        <nav className="flex items-center gap-4">
          <a className="hover:underline" href="/privacy">{t.privacy}</a>
          <a className="hover:underline" href="/terms">{t.terms}</a>
          <a className="hover:underline" href="/contact">{t.contact}</a>
        </nav>
      </div>
    </footer>
  );
}
