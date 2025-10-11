// components/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="py-10 text-xs opacity-70 border-t border-black/10 dark:border-white/10">
      <div className="mx-auto max-w-6xl px-4 flex flex-wrap items-center justify-between gap-3">
        <span>© {new Date().getFullYear()} RentBack Technologies (Pvt) Ltd</span>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:opacity-100 opacity-80">Privacy</Link>
          <Link href="/founder" className="hover:opacity-100 opacity-80">Founder</Link>
          <Link href="/terms" className="hover:opacity-100 opacity-80">Terms</Link>
          <a href="mailto:help@rentback.app" className="hover:opacity-100 opacity-80">Contact</a>
        </div>
      </div>
    </footer>
  );
}
