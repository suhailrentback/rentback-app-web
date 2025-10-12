// app/page.tsx
import Link from "next/link";
import { getLang, getCopy } from "@/lib/i18n";

export default function Home() {
  const lang = getLang();
  const t = getCopy(lang).landing; // LandingCopy

  return (
    <section className="py-16 grid lg:grid-cols-2 gap-10 items-start">
      {/* Left: hero copy */}
      <div className="space-y-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          <span className="block">{t.h1a}</span>
          <span className="block text-emerald-600">{t.h1b}</span>
        </h1>

        <p className="text-lg text-neutral-600 dark:text-neutral-300">
          {t.heroSubtitle}
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/sign-in"
            className="px-5 py-3 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {t.cta}
          </Link>
          <a
            href="#features"
            className="px-5 py-3 rounded-xl font-semibold border border-neutral-300 dark:border-neutral-700 hover:bg-black/5 dark:hover:bg-white/10"
          >
            {t.ctaSecondary}
          </a>
        </div>

        <ul id="features" className="mt-6 space-y-2 text-neutral-700 dark:text-neutral-300">
          {t.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-600" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Right: mock card */}
      <div className="mx-auto w-full max-w-sm">
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-950">
          <div className="flex items-center justify-between">
            <div className="text-xl font-semibold">RentBack</div>
            <div className="text-sm opacity-70">PK</div>
          </div>

          <div className="mt-6 rounded-xl bg-neutral-900 text-white p-4">
            <div className="text-sm opacity-80">BILL PAY • RAAST • REWARDS</div>
            <div className="mt-4 text-2xl tracking-widest">6032 • • • • • • 3912</div>
            <div className="mt-6 flex items-center justify-between text-xs opacity-80">
              <div>
                <div>VALID THRU</div>
                <div>12/27</div>
              </div>
              <div className="font-semibold">MR RENTER</div>
            </div>
          </div>

          <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
            Mock card UI for preview only.
          </p>
        </div>
      </div>
    </section>
  );
}
