// app/page.tsx
// Landing page content only — header & footer come from app/layout.tsx
export const dynamic = "force-static";

import Link from "next/link";

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            Pay rent, earn <span className="text-emerald-600 dark:text-emerald-400">rewards.</span>
          </h1>
          <p className="mt-4 text-lg opacity-80">
            A modern rent-payments experience for Pakistan — Raast, cards & wallets, and a local rewards
            marketplace.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/sign-in"
              className="px-5 py-3 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Get started
            </Link>
            <a
              href="#features"
              className="px-5 py-3 rounded-xl font-semibold border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
            >
              Learn more
            </a>
          </div>

          <ul className="mt-8 space-y-2 text-sm opacity-80">
            <li>• Pay via Raast, card, or wallet</li>
            <li>• Earn points and redeem with local brands</li>
            <li>• English/Urdu, light/dark, mobile-first</li>
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
          <p className="mt-3 text-xs opacity-70">Mock card UI for preview only.</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-12 grid md:grid-cols-3 gap-6">
        <Feature
          title="Raast native"
          desc="Bank transfer rails with references matched to receipts."
        />
        <Feature
          title="Rewards engine"
          desc="Points accrual, promo codes, and a marketplace to redeem."
        />
        <Feature
          title="Built for PK"
          desc="PKR formatting, Urdu support, and fintech-grade UI."
        />
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
