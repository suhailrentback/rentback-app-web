"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function LandlordHome() {
  const params = useSearchParams();
  const created = params.get("created");

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Landlord</h1>
          <p className="text-sm text-gray-600">Issue and manage invoices.</p>
        </div>

        <Link
          href="/landlord/invoices/new"
          className="rounded-md bg-black text-white px-4 py-2 text-sm"
        >
          Create invoice
        </Link>
      </div>

      {created && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Invoice created successfully.
        </div>
      )}

      <div className="rounded-md border p-6 text-sm text-gray-600">
        Coming soon: invoice list, filters, search.
      </div>
    </div>
  );
}
