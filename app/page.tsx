// app/page.tsx
import Link from "next/link";

/**
 * RentBack — Home
 * Simple, modern, brand-forward landing built only with Tailwind classes.
 * No client hooks and no new dependencies. A11y friendly + RTL-friendly via layout dir.
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

function IconReceipt() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        d="M8 3h8l2 2v14l-2-1-2 1-2-1-2 1-2-1-2 1V5l2-2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconGift() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        d="M20 12v7a2 2 0 0 1-2 2h-3v-9h5zM9 21H6a2 2 0 0 1-2-2v-7h5v9z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M12 7v14M3 12h18M7 7c0-1.657 1.79-3 4-3 0 2-2 3-4 3zm10 0c0-1.657-1.79-3-4-3 0 2 2 3 4 3z" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      {/* Simple emerald mark */}
      <span className="inline-grid h-6 w-6 place-items-center rounded-md bg-emerald-600 text-white">
        RB
      </span>
      <span className="text-base font-semibold tracking-tight">RentBack</span>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-0px)] bg-white text-gray-900">
      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Gradient aura */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[420px] bg-gradient-to-b from-emerald-200/60 via-emerald-100/40 to-transparent blur-2xl"
        />
        <div className="mx-auto max-w-6xl px-6 pb-10 pt-16 sm:pt-20">
          <div className="flex items-center justify-between gap-6">
            <BrandMark />
            <Link
              href="/sign-in"
              className="rounded-full border border-emerald-700/20 bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              Sign in
            </Link>
          </div>

          <div className="mx-auto mt-12 max-w-3xl text-center">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Pay rent easily. Get receipts instantly. <span className="text-emerald-600">Earn rewards.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-balance text-gray-600">
              RentBack streamlines rent for tenants and landlords — with transparent invoices, confirmed payments, and a simple rewards program.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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

            {/* Mini trust row */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-gray-500">
              <span>Role-based access • Strict RLS</span>
              <span aria-hidden="true" className="hidden sm:inline">•</span>
              <span>Receipts (PDF)</span>
              <span aria-hidden="true" className="hidden sm:inline">•</span>
              <span>Rewards program</span>
            </div>
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
              <p className="mt-1 text-sm text-gray-600">
                Use your email to receive a secure magic link.
              </p>
            </li>
            <li className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold text-emerald-700">Step 2</div>
              <div className="mt-1 font-medium">View & pay invoices</div>
              <p className="mt-1 text-sm text-gray-600">
                Track your lease, payments, and receipts in one place.
              </p>
            </li>
            <li className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold text-emerald-700">Step 3</div>
              <div className="mt-1 font-medium">Earn rewards</div>
              <p className="mt-1 text-sm text-gray-600">
                Confirmed payments earn points you can redeem for offers.
              </p>
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
              <li className="flex items-start gap-2">
                <IconCheck />
                <span>See invoices & receipts in one place</span>
              </li>
              <li className="flex items-start gap-2">
                <IconCheck />
                <span>Manual confirmation today; Autopay coming soon</span>
              </li>
              <li className="flex items-start gap-2">
                <IconCheck />
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
                <IconCheck />
                <span>Issue invoices; track payments and payouts</span>
              </li>
              <li className="flex items-start gap-2">
                <IconCheck />
                <span>Export ledgers and statements</span>
              </li>
              <li className="flex items-start gap-2">
                <IconCheck />
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
