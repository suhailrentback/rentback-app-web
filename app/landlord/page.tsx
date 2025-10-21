// app/landlord/page.tsx
import Link from "next/link";

export default function LandlordHome() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Landlord</h1>

      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          Quick actions for managing tenant invoices.
        </p>
        <div className="flex gap-3">
          <Link
            href="/landlord/invoices"
            className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          >
            View invoices
          </Link>
          <Link
            href="/landlord/invoices/new"
            className="inline-flex items-center rounded-md bg-black text-white px-3 py-2 text-sm hover:opacity-90"
          >
            Create invoice
          </Link>
        </div>
      </div>
    </main>
  );
}
