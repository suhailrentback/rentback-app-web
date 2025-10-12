// USE IN WEB REPO ONLY: rentback-app-web
// app/page.tsx
import Link from "next/link";
import { getLang, getCopy } from "@/lib/i18n";

export default function Landing() {
  const lang = getLang();
  const t = getCopy(lang).landing!;

  return (
    <section className="py-16 grid lg:grid-cols-2 gap-10 items-start">
      <div className="space-y-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          <span className="block">{t.h1a}</span>
          <span className="block text-emerald-600">{t.h1b}</span>
        </h1>

        <p className="text-lg text-neutral-600 dark:text-neutral-300">{t.sub}</p>

        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="px-5 py-3 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {t.cta}
          </Link>
          <a
            href="#features"
            className="px-5 py-3 rounded-xl font-semibold border border-black/10 dark:border-white/10"
          >
            {t.learnMore}
          </a>
        </div>

        <ul id="features" className="mt-6 space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
          {t.bullets.map((b, i) => (
            <li key={i}>• {b}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl p-6 border border-black/10 dark:border-white/10 bg-white/60 dark:bg-neutral-900/40">
        <div className="text-sm uppercase tracking-widest opacity-70">BILL PAY • RAAST • REWARDS</div>
        <div className="mt-6 h-40 rounded-xl bg-gradient-to-tr from-emerald-600/20 to-emerald-600/40 border border-emerald-600/30 flex items-center justify-center">
          <span className="text-sm opacity-70">Mock card UI for preview only.</span>
        </div>
      </div>
    </section>
  );
}
