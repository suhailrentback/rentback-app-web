// app/page.tsx
import Link from "next/link";

/**
 * RentBack — Home (simple + modern, brand-preserving)
 * - Uses your existing logo at /logo.svg and the RentBack wording
 * - Hero: "Pay Rent, Earn Rewards."
 * - Minimal fintech look: clean grid, soft borders, emerald accents
 * - No client hooks, no new deps (Server Component). RTL-safe via layout.
 */

function IconCheck() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        d="M20 6L9 17l-5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-[100svh] bg-white text-gray-900">
      {/* Top aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-56 z-0 h-[520px] bg-gradient-to-b from-emerald-200/70 via-emerald-100/40 to-transparent blur-2xl"
      />

      {/* NAV */}
      <header className="relative z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <a href="/" className="inline-flex items-center gap-3" aria-label="RentBack home">
            {/* Your logo and wording — unchanged */}
            <img
              src="/logo.svg"
              alt="RentBack"
              className="h-8 w-auto"
              loading="eager"
              decoding="async"
            />
            <span className="text-base font-semibold tracking-tight">RentBack</span>
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

      {/* HERO (Simple + bolder) */}
      <section className="relative z-10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 pb-12 pt-10 sm:pt-16 md:grid-cols-12">
          {/* Headline */}
          <div className="md:col-span-7">
            <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Pay Rent, <span className="text-emerald-600">Earn Rewards.</span>
            </h1>
            <p className="mt-4 max-w-xl text-balance text-gray-600">
              Transparent invoices, instant PDF receipts, and a simple rewards program—built with strict role-based access and audit logs.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
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

            {/* Trust row */}
            <div className="mt-7 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className="rounded-full border px-3 py-1">Role-based access</span>
              <span className="rounded-full border px-3 py-1">Strict RLS</span>
              <span className="rounded-full border px-3 py-1">PDF receipts</span>
              <span className="rounded-full border px-3 py-1">Audit logs</span>
            </div>
          </div>

          {/* Minimal mock (simpler, cleaner) */}
          <div className="md:col-span-5">
            <div className="mx-auto w-full max-w-md">
              <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm ring-1 ring-emerald-100">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900">Invoice</div>
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
                  <div className="text-xs text-gray-500">Reference</div>
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
              <p className="mt-2 text-center text-xs text-gray-500">
                Preview only. Actual receipts are generated server-side.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES — simplified modern cards */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-12 sm:py-14">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <article className="group rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-sm ring-1 ring-transparent transition hover:shadow-md hover:ring-emerald-100">
            <div className="flex items-center gap-2 text-emerald-700">
              <IconCheck />
              <h3 className="text-base font-semibold">Clear invoices</h3>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Draft → Issued → Paid/Overdue lifecycle. Manual confirmation today; PSP integration later.
            </p>
          </article>

          <article className="group rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-sm ring-1 ring-transparent transition hover:shadow-md hover:ring-emerald-100">
            <div className="flex items-center gap-2 text-emerald-700">
              <IconCheck />
              <h3 className="text-base font-semibold">Instant receipts</h3>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Server-generated PDFs, downloadable anytime. Email attachments when configured.
            </p>
          </article>

          <article className="group rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-sm ring-1 ring-transparent transition hover:shadow-md hover:ring-emerald-100">
            <div className="flex items-center gap-2 text-emerald-700">
              <IconCheck />
              <h3 className="text-base font-semibold">Rewards you can use</h3>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Earn points on confirmed payments and redeem simple offers. Marketplace in V2.
            </p>
          </article>
        </div>
      </section>

      {/* HOW IT WORKS — minimal 3 steps */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-white p-6 ring-1 ring-emerald-100 sm:p-8">
          <h2 className="text-lg font-semibold">How it works</h2>
          <ol className="mt-4 grid gap-4 sm:grid-cols-3">
            <li className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold text-emerald-700">Step 1</div>
              <div className="mt-1 font-medium">Sign in</div>
              <p className="mt-1 text-sm text-gray-600">Use your email to get a secure magic link.</p>
            </li>
            <li className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold text-emerald-700">Step 2</div>
              <div className="mt-1 font-medium">View & pay</div>
              <p className="mt-1 text-sm text-gray-600">Invoices, payments, and receipts in one place.</p>
            </li>
            <li className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold text-emerald-700">Step 3</div>
              <div className="mt-1 font-medium">Earn rewards</div>
              <p className="mt-1 text-sm text-gray-600">Points on confirmed payments; redeem offers.</p>
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

      {/* FOOTER */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm text-gray-600">
          <a href="/" className="inline-flex items-center gap-3" aria-label="RentBack home">
            <img src="/logo.svg" alt="RentBack" className="h-6 w-auto" />
            <span className="font-medium">RentBack</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
