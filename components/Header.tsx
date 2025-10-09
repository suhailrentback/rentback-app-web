import Link from 'next/link';
import Brand from './Brand';

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/30 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <Link href="/"><Brand /></Link>
        <nav className="flex items-center gap-2">
          <Link href="/founder" className="px-3 py-2 text-sm rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
            Founder
          </Link>
          <Link href="/sign-in" className="px-3 py-2 text-sm rounded-lg bg-brand-600 hover:bg-brand-700 text-white">
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
