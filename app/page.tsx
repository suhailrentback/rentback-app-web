// app/page.tsx
import Link from "next/link";

/**
 * RentBack — Home (fintech hero, brand-preserving)
 * - Bigger, bolder headings
 * - Fintech-style gradient + subtle receipt mock
 * - No client hooks, no new deps (Server Component)
 * - RTL-safe via layout dir
 */

function IconCheck() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconReceipt() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M8 3h8l2 2v14l-2-1-2 1-2-1-2 1-2-1-2 1V5l2-2z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconGift() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M20 12v7a2 2 0 0 1-2 2h-3v-9h5zM9 21H6a2 2 0 0 1-2-2v-7h5v9z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v14M3 12h18M7 7c0-1.657 1.79-3 4-3 0 2-2 3-4 3zm10 0c0-1.657-1.79-3-4-3 0 2 2 3 4 3z" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      {/* Keep your current mark/text; replace if you already use /logo.svg elsewhere */}
      <span className="inline-grid h-6 w-6 place-items-center rounded-md bg-emerald-600 text-white">RB</span>
      <span className="text-base font-semibold tracking-tight">RentBack</span>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-[100svh] bg-white text-gray-900">
      {/* FINTECH AURA */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-56 z-0 h-[520px] bg-gradient-to-b from-emerald-200/70 via-emerald-100/40 to-transparent blur-2xl"
      />

      {/* NAV */}
      <header className="relative z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <a href="/" className="inline-flex items-center gap-3" aria-label="RentBack home">
            <BrandMark />
          </a>
          <nav className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="rounded-full border border-emerald-700/15 bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO (BOLDER, FINTECH) */}
      <section className="relative z-10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 pb-10 pt-10 sm:pt-14 md:grid-cols-2">
          {/* Left: Headline */}
          <div className="text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700/90">
              Secure • Audited • RLS by default
            </p>
            <h1 className="mt-3 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Pay rent like{" "}
              <span className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                fintech
              </span>
              .
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-balance text-gray-600 md:mx-0">
              Transparent invoices, instant PDF receipts, and rewards — built on strict role-based access and audit logs.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <Link
                href="/sign-in"
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                Get started
              </Link>
              <a
                href="#features"
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                See features
              </a>
            </div>

            {/* Trust pills */}
            <div className="mt-7 flex flex-wrap items-center gap-2 text-xs text-gray-500 md:justify-start">
              <span className="rounded-full border px-3 py-1">Role-based access</span>
              <span className="rounded-full border px-3 py-1">Strict RLS</span>
              <span className="rounded-full border px-3 py-1">PDF receipts</span>
              <span className="rounded-full border px-3 py-1">Rewards</span>
            </div>
          </div>

          {/* Right: Fintech-style receipt mock */}
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-3xl border border-emerald-900/10 bg-white/70 p-5 shadow-md ring-1 ring-emerald-100 backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Invoice #RB-1024</div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                  ISSUED
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-gray-500">Tenant</div>
                  <div className="font-medium">you@example.com</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-xs text-gray-500">Due date</div>
                  <div className="font-medium">Oct 30</div>
                </div>
                <div className="col-span-2 rounded-xl border p-3">
                  <div className="text-xs text-gray-500">Amount</div>
                  <div className="text-2xl font-semibold tracking-tight">PKR 65,000</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-gray-500">Secure reference</div>
                <div className="font-mono text-xs">RB-9F3K-27Q</div>
              </div>
              <div className="mt-4">
                <button
                  className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  type="button"
                  aria-label="Pay now"
                >
                  Pay now
                </button>
              </div>
            </div>

            {/* tiny caption */}
            <p className="mt-2 text-center text-xs text-gray-500">
              Sample preview. Actual invoices/receipts are generated server-side.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-700">
              <IconCheck />
              <h3 className="text-base font-semibold">Clear invoices</h3>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Draft → Issued → Paid/Overdue lifecycle with manual confirmation today and PSP integration later.
            </p>
          </div>

          <div className="rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-700">
              <IconReceipt />
              <h3 className="text-base font-semibold">Instant receipts</h3>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              PDF receipts generated server-side, downloadable anytime. Email attachments when configured.
            </p>
          </div>

          <div className="rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-700">
              <IconGift />
              <h3 className="text-base font-semibold">Rewards you can use</h3>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Earn points on confirmed payments and redeem simple offers. Marketplace coming in V2.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-6 pb-12 sm:pb-16">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-white p-6 ring-1 ring-emerald-100 sm:p-8">
          <h2 className="text-xl font-semibold">How it works</h2>
          <ol className="mt-4 grid gap-4 sm:grid-cols-3">
            <li className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold text-emerald-700">Step 1</div>
              <div className="mt-1 font-medium">Sign in</div>
              <p className="mt-1 text-sm text-gray-600">Use your email to receive a secure magic link.</p>
            </li>
            <li className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold text-emerald-700">Step 2</div>
              <div className="mt-1 font-medium">View & pay invoices</div>
              <p className="mt-1 text-sm text-gray-600">Track your lease, payments, and receipts in one place.</p>
            </li>
            <li className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold text-emerald-700">Step 3</div>
              <div className="mt-1 font-medium">Earn rewards</div>
              <p className="mt-1 text-sm text-gray-600">Confirmed payments earn points you can redeem for offers.</p>
            </li>
          </ol>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/sign-in"
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              Sign in to continue
            </Link>
            <a
              href="/tenant/rewards"
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              View rewards
            </a>
          </div>
        </div>
      </section>

      {/* SPLIT CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border p-6 shadow-sm">
            <div className="text-xs font-semibold text-emerald-700">For Tenants</div>
            <h3 className="mt-1 text-lg font-semibold">Your rent, simplified</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2"><IconCheck /><span>See invoices & receipts in one place</span></li>
              <li className="flex items-start gap-2"><IconCheck /><span>Manual confirmation today; Autopay coming soon</span></li>
              <li className="flex items-start gap-2"><IconCheck /><span>Earn points on confirmed payments</span></li>
            </ul>
            <Link href="/sign-in" className="mt-4 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600">
              Tenant sign in
            </Link>
          </div>

          <div className="rounded-3xl border p-6 shadow-sm">
            <div className="text-xs font-semibold text-emerald-700">For Landlords</div>
            <h3 className="mt-1 text-lg font-semibold">Visibility & control</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2"><IconCheck /><span>Issue invoices; track payments and payouts</span></li>
              <li className="flex items-start gap-2"><IconCheck /><span>Export ledgers and statements</span></li>
              <li className="flex items-start gap-2"><IconCheck /><span>Built-in audit logs & role-based access</span></li>
            </ul>
            <Link href="/sign-in" className="mt-4 inline-flex rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-600">
              Landlord sign in
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm text-gray-600">
          <BrandMark />
          <div className="flex items-center gap-4">
            <a className="hover:text-emerald-700" href="/debug/status">Status</a>
            <a className="hover:text-emerald-700" href="/api/health">Health</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
