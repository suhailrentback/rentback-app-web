// app/landlord/page.tsx
import Link from "next/link";

export default function LandlordDashboard() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Landlord</h1>
        <p className="text-sm text-gray-600">
          Manage invoices and tenants.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/landlord/invoices"
          className="rounded-xl border p-6 hover:bg-gray-50 transition"
        >
          <div className="text-lg font-medium">Invoices</div>
          <p className="text-sm text-gray-600">Review existing invoices.</p>
          <div className="mt-4 inline-flex items-center text-blue-600 text-sm">
            Go to list →
          </div>
        </Link>

        <Link
          href="/landlord/invoices/new"
          className="rounded-xl border p-6 hover:bg-gray-50 transition"
        >
          <div className="text-lg font-medium">Create invoice</div>
          <p className="text-sm text-gray-600">Issue a new invoice to a tenant.</p>
          <div className="mt-4 inline-flex items-center text-blue-600 text-sm">
            Start new →
          </div>
        </Link>
      </section>

      <footer>
        <Link href="/landlord/invoices" className="text-sm text-blue-600 hover:underline">
          Or jump straight to invoices →
        </Link>
      </footer>
    </main>
  );
}
