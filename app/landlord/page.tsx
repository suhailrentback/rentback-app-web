import Link from 'next/link';

export default function LandlordDashboardPage() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Landlord</h1>
      <p className="text-sm text-gray-500 mb-6">
        Create invoices and manage tenant billing.
      </p>

      <div className="grid gap-4">
        <Link
          href="/landlord/invoices/new"
          className="inline-flex items-center rounded-xl border px-4 py-2 shadow-sm hover:shadow"
        >
          ➕ Create Invoice
        </Link>

        {/* You can add more landlord tiles here later */}
        <Link
          href="/tenant/invoices"
          className="inline-flex items-center rounded-xl border px-4 py-2 shadow-sm hover:shadow"
        >
          🔎 View Tenant Invoices (for quick testing)
        </Link>
      </div>
    </div>
  );
}
