import Link from "next/link";
import { getCopy, getLang } from "@/lib/i18n";

export default function Home() {
  const lang = getLang();
  const t = getCopy(lang).landing;

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="py-16 grid lg:grid-cols-2 gap-10 items-start">
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            <span className="block">{t.h1a}</span>
            <span className="block text-emerald-600">{t.h1b}</span>
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-300">
            {t.sub}
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/sign-in"
              className="px-5 py-3 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {t.ctaPrimary}
            </Link>
            <a
              href="#features"
              className="px-5 py-3 rounded-xl font-semibold border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              {t.ctaSecondary}
            </a>
          </div>

          <ul className="mt-6 space-y-1 text-sm text-neutral-500 dark:text-neutral-400">
            {t.bullets.map((b, i) => (
              <li key={i}>• {b}</li>
            ))}
          </ul>
        </div>

        {/* Simple mock card */}
        <div className="relative">
          <div className="mx-auto w-full max-w-md rounded-2xl p-6 shadow-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
            <div className="flex items-center justify-between text-sm opacity-80">
              <span>RentBack</span>
              <span>PK</span>
            </div>
            <div className="mt-8 text-2xl font-mono tracking-widest">
              6032 • • • • • • 3912
            </div>
            <div className="mt-4 text-xs opacity-80">
              BILL PAY • RAAST • REWARDS
            </div>
            <div className="mt-8 flex items-end justify-between">
              <div className="text-xs">
                <div className="opacity-60">VALID THRU</div>
                <div>12/27</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">MR RENTER</div>
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            {t.mockNote}
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="grid md:grid-cols-3 gap-6">
        {t.features.map((f, i) => (
          <div
            key={i}
            className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6"
          >
            <div className="text-emerald-600 font-semibold">✓</div>
            <h3 className="mt-2 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
              {f.desc}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
