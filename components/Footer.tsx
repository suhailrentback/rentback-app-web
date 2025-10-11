// components/Footer.tsx (server component)
import Link from "next/link";
import { getLang, getCopy } from "@/lib/i18n";

export default function Footer() {
  const lang = getLang();
  const t = getCopy(lang).common;
  const year = new Date().getFullYear();

  return (
    <footer className="py-10 text-xs opacity-70">
      <div className="mx-auto max-w-6xl px-4 flex flex-wrap items-center justify-between gap-3">
        <span>© {year} RentBack Technologies (Pvt) Ltd</span>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:opacity-100 opacity-80">{t.privacy}</Link>
          <Link href="/founder" className="hover:opacity-100 opacity-80">{
            getCopy(lang).common.founder
          }</Link>
          <Link href="/terms" className="hover:opacity-100 opacity-80">{t.terms}</Link>
          <a href="mailto:help@rentback.app" className="hover:opacity-100 opacity-80">{t.contact}</a>
        </div>
      </div>
    </footer>
  );
}
