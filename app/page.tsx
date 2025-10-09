import Brand from '@/components/Brand';
import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="py-12 grid md:grid-cols-2 gap-10 items-center">
      <div>
        <Brand size={28} />
        <h1 className="mt-4 text-4xl md:text-5xl font-extrabold leading-tight">
          Pay rent, earn <span className="text-brand-600 dark:text-brand-400">rewards</span>.
        </h1>
        <p className="mt-4 text-lg opacity-80">
          A modern rent-payments experience for Pakistan — Raast, cards & wallets, and a local rewards marketplace.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/sign-in"
            className="px-5 py-3 rounded-xl font-semibold bg-brand-600 hover:bg-brand-700 text-white"
          >
            Sign in
          </Link>
          <a
            href="#features"
            className="px-5 py-3 rounded-xl font-semibold border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
          >
            Learn more
          </a>
        </div>
      </div>

      <div className="relative">
        <div
          className="absolute -inset-6 blur-3xl opacity-30 hidden dark:block"
          style={{ background: 'conic-gradient(from 90deg at 50% 50%, #059669, #10b981, #34d399)' }}
        />
        <div className="relative rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 p-6">
          <div className="rounded-xl p-5 bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-lg">
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
        </div>
        <p className="mt-3 text-xs opacity-70">Mock card UI for preview only.</p>
      </div>
    </section>
  );
}
