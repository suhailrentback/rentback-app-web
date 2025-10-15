// app/page.tsx
import Link from "next/link";

/**
 * RentBack — Home (brand-preserving)
 * - Uses your existing logo: /logo.svg (no brand changes)
 * - Emerald-forward, modern, accessible, RTL-safe
 * - No client hooks, no new deps (server component)
 */

export default function HomePage() {
  return (
    <div className="min-h-[100svh] bg-white text-gray-900">
      {/* Top aura background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 z-0 h-[420px] bg-gradient-to-b from-emerald-200/70 via-emerald-100/40 to-transparent blur-2xl"
      />

      {/* NAV */}
      <header className="relative z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          {/* Your logo — unchanged */}
          <a href="/" className="inline-flex items-center gap-3" aria-label="RentBack home">
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

      {/* HERO */}
      <section className="relative z-10">
        <div className="mx-auto max-w-6xl px-6 pb-10 pt-10 sm:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            {/* Keep the brand wording up-front and unchanged */}
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              RentBack
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-balance text-gray-600">
              Simple rent for tenants and landlords — transparent invoices, confirmed payments,
              downloadable receipts, and a straightforward rewards program.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
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
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500">
              <span className="rounded-full border px-3 py-1">Role-based access</span>
              <span className="rounded-full border px-3 py-1">Strict RLS</span>
              <span className="rounded-full border px-3 py-1">PDF receipts</span>
              <span className="rounded-full border px-3 py-1">Rewards</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 py-10 sm:py-14">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <article className="group rounded-3xl border border-emerald-900/5 bg-white p-6 shadow-sm ring-1 ring-transparent transition hover:shadow-md hover:ring-emerald-100">
            <div className="flex items-center gap-2 text-emerald-700">
              <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-base font-semibold">Clear invoices</h3>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Draft → Issued → Paid/Overdue lifecycle with manual confirmation today and PSP integration later.
            </p>
          </article>

          <article className="group rounded-3xl border border-emerald-900/5 bg-white p-6 shadow-sm ring-1 ring-transparent transition hover:shadow-md hover:ring-emerald-100">
            <div className="flex items-center gap-2 text-emerald-700">
              <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-base font-semibold">Instant receipts</h3>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Server-generated PDF receipts, downloadable anytime. Email attachments when configured.
            </p>
          </article>

          <article className="group rounded-3xl border border-emerald-900/5 bg-white p-6 shadow-sm ring-1 ring-transparent transition hover:shadow-md hover:ring-emerald-100">
            <div className="flex items-center gap-2 text-emerald-700">
              <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-base font-semibold">Rewards that work</h3>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Earn points on confirmed payments and redeem simple offers. Marketplace coming in V2.
            </p>
          </article>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-12 sm:pb-16">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-white p-6 ring-1 ring-emerald-100 sm:p-8">
          <h2 className="text-lg font-semibold">How it works</h2>
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
              <p className="mt-1 text-sm text-gray-600">Confirmed payments earn points you can redeem.</p>
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
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border p-6 shadow-sm">
            <div className="text-xs font-semibold text-emerald-700">For Tenants</div>
            <h3 className="mt-1 text-lg font-semibold">Your rent, simplified</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Invoices & receipts in one place</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Manual confirmation today; Autopay soon</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Earn points on confirmed payments</span>
              </li>
            </ul>
            <Link
              href="/sign-in"
              className="mt-4 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              Tenant sign in
            </Link>
          </div>

          <div className="rounded-3xl border p-6 shadow-sm">
            <div className="text-xs font-semibold text-emerald-700">For Landlords</div>
            <h3 className="mt-1 text-lg font-semibold">Visibility & control</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Issue invoices; track payments and payouts</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Export ledgers and statements</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Built-in audit logs & role-based access</span>
              </li>
            </ul>
            <Link
              href="/sign-in"
              className="mt-4 inline-flex rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              Landlord sign in
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm text-gray-600">
          <a href="/" className="inline-flex items-center gap-3" aria-label="RentBack home">
            <img src="/logo.svg" alt="RentBack" className="h-6 w-auto" />
            <span className="font-medium">RentBack</span>
          </a>
          <div className="flex items-center gap-4">
            <a className="hover:text-emerald-700" href="/debug/status">Status</a>
            <a className="hover:text-emerald-700" href="/api/health">Health</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
