// app/tenant/page.tsx
import Link from "next/link";

export default function TenantHome() {
  return (
    <main className="min-h-[80vh] bg-white">
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-emerald-50 to-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Tenant dashboard
            </h1>
            <Link
              href="/sign-out"
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              Sign out
            </Link>
          </div>

          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Welcome to RentBack. View invoices, download receipts, and track your rewards.
          </p>

          {/* Quick status row */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border p-4 shadow-sm">
              <div className="text-xs font-semibold text-emerald-700">Invoices</div>
              <div className="mt-1 text-2xl font-semibold">—</div>
              <p className="mt-1 text-xs text-gray-500">Issued & due soon</p>
            </div>
            <div className="rounded-2xl border p-4 shadow-sm">
              <div className="text-xs font-semibold text-emerald-700">Receipts</div>
              <div className="mt-1 text-2xl font-semibold">—</div>
              <p className="mt-1 text-xs text-gray-500">Available to download</p>
            </div>
            <div className="rounded-2xl border p-4 shadow-sm">
              <div className="text-xs font-semibold text-emerald-700">Rewards</div>
              <div className="mt-1 text-2xl font-semibold">—</div>
              <p className="mt-1 text-xs text-gray-500">Points balance</p>
            </div>
          </div>
        </div>
      </section>

      {/* Actions */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Invoices & payments</h2>
            <p className="mt-2 text-sm text-gray-600">
              Review your rent invoices and payment history in one place.
            </p>
            <div className="mt-4 flex gap-3">
              <Link
                href="/tenant/invoices"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                View invoices
              </Link>
              <Link
                href="/tenant/receipts"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                Download receipts
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Rewards</h2>
            <p className="mt-2 text-sm text-gray-600">
              Earn points on confirmed payments and redeem simple offers.
            </p>
            <div className="mt-4">
              <Link
                href="/tenant/rewards"
                className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                View rewards
              </Link>
            </div>
          </div>
        </div>

        {/* Help */}
        <div className="mt-8 rounded-2xl border p-6 text-sm text-gray-600">
          Having trouble? Try a hard reload (Cmd/Ctrl+Shift+R). If you still see access issues,
          open <code className="rounded bg-gray-100 px-1 py-0.5">/api/auth/sync</code> once, then return here.
        </div>
      </section>
    </main>
  );
}
