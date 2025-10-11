// app/page.tsx — landing content only (header/footer come from layout)
import Link from "next/link";
import { getLang, getCopy } from "@/lib/i18n";

export default function LandingPage() {
  const lang = getLang();
  const t = getCopy(lang).landing;

  return (
    <>
      {/* Hero */}
      <section className="py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            {t.h1a} <span className="text-emerald-600 dark:text-emerald-400">{t.h1b}</span>
          </h1>
          <p className="mt-4 text-lg opacity-80">{t.sub}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/sign-in"
              className="px-5 py-3 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {t.cta}
            </Link>
            <a
              href="#features"
              className="px-5 py-3 rounded-xl font-semibold border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
            >
              {t.learn}
            </a>
          </div>

          <ul className="mt-8 space-y-2 text-sm opacity-80">
            <li>• {t.point1}</li>
            <li>• {t.point2}</li>
            <li>• {t.point3}</li>
          </ul>
        </div>

        <div className="relative">
          <div
            className="absolute -inset-6 blur-3xl opacity-30 hidden dark:block"
            style={{
              background:
                "conic-gradient(from 90deg at 50% 50%, #059669, #10b981, #34d399)",
            }}
          />
          <div className="relative rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 p-6">
            <MockCard />
          </div>
          <p className="mt-3 text-xs opacity-70">{t.mockNote}</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-12 grid md:grid-cols-3 gap-6">
        <Feature title={lang === "ur" ? "راست انٹیگریشن" : "Raast native"} desc={lang === "ur"
          ? "بینک ٹرانسفر کے ذریعے ریفرنس کے ساتھ رسید میچنگ۔"
          : "Bank transfer rails with references matched to receipts."
        } />
        <Feature title={lang === "ur" ? "ریوارڈز انجن" : "Rewards engine"} desc={lang === "ur"
          ? "پوائنٹس، پرومو کوڈز، اور ریڈیم مارکیٹ پلیس۔"
          : "Points accrual, promo codes, and a marketplace to redeem."
        } />
        <Feature title={lang === "ur" ? "پاکستان کے لیے" : "Built for PK"} desc={lang === "ur"
          ? "PKR فارمیٹنگ، اردو سپورٹ، اور جدید فن ٹیک UI۔"
          : "PKR formatting, Urdu support, and fintech-grade UI."
        } />
      </section>
    </>
  );
}

function MockCard() {
  return (
    <div className="rounded-xl p-5 bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-lg">
      <div className="flex items-center justify-between text-sm opacity-90">
        <span>RentBack</span>
        <span>PK</span>
      </div>
      <div className="mt-6 text-2xl font-semibold tracking-widest">6032 • • • • • • 3912</div>
      <div className="mt-6 text-sm opacity-90">BILL PAY • RAAST • REWARDS</div>
      <div className="mt-8 flex items-center justify-between text-sm">
        <span>VALID THRU 12/27</span>
        <span>MR RENTER</span>
      </div>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 p-5 bg-white dark:bg-white/5">
      <div className="h-10 w-10 rounded-xl bg-emerald-600/10 dark:bg-emerald-400/10 flex items-center justify-center mb-3">
        <span className="text-emerald-700 dark:text-emerald-300">✓</span>
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm opacity-80 mt-1">{desc}</p>
    </div>
  );
}
