// WEB: place in rentback-app-web/app/page.tsx
import Link from "next/link";
import { getLang, getCopy } from "@/lib/i18n";

export default function Landing() {
  const lang = getLang();
  const t = getCopy(lang).landing;

  return (
    <section className="py-16 grid lg:grid-cols-2 gap-10 items-start">
      <div className="space-y-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          {t.h1}
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
            className="px-5 py-3 rounded-xl font-semibold border border-neutral-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
          >
            {t.learn}
          </a>
        </div>

        <ul id="features" className="mt-4 grid gap-2">
          {t.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-[6px] h-2 w-2 rounded-full bg-emerald-500" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-black/5 dark:border-white/10 p-6">
        <div className="text-sm opacity-70 mb-2">Mock card UI for preview only.</div>
        <div className="rounded-2xl border border-black/5 dark:border-white/10 p-6 bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-900/10">
          <div className="font-mono text-xl tracking-widest">6032 • • • • • • 3912</div>
          <div className="mt-2 text-sm opacity-70">BILL PAY • RAAST • REWARDS</div>
          <div className="mt-10 flex items-center justify-between text-sm">
            <div>
              <div className="opacity-60">VALID THRU</div>
              <div className="font-semibold">12/27</div>
            </div>
            <div className="font-semibold">MR RENTER</div>
          </div>
        </div>
      </div>
    </section>
  );
}
