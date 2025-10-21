// app/landlord/invoices/new/page.tsx
import Link from "next/link";

export const dynamic = "force-static"; // simple static form page

export default function NewInvoicePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/landlord" className="text-sm text-blue-600 hover:underline">
          ← Back to landlord dashboard
        </Link>
        <span className="text-gray-400">/</span>
        <span className="font-medium">Create invoice</span>
      </div>

      <h1 className="mb-2 text-2xl font-semibold">Create invoice</h1>
      <p className="mb-8 text-sm text-gray-600">
        Internal tool: enter the tenant’s UUID directly for now (we’ll upgrade
        to search-by-email after we add a safe admin lookup).
      </p>

      <form
        action="/api/landlord/invoices"
        method="post"
        className="grid gap-5"
      >
        <div>
          <label htmlFor="tenant_id" className="block text-sm font-medium">
            Tenant ID (UUID)
          </label>
          <input
            id="tenant_id"
            name="tenant_id"
            required
            placeholder="6746a57e-fafd-4718-811d-49130102795a"
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="number" className="block text-sm font-medium">
            Invoice number (optional)
          </label>
          <input
            id="number"
            name="number"
            placeholder="INV-2025-001"
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="amount_rupees" className="block text-sm font-medium">
              Amount (rupees)
            </label>
            <input
              id="amount_rupees"
              name="amount_rupees"
              type="number"
              step="1"
              min="0"
              required
              placeholder="25000"
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="currency" className="block text-sm font-medium">
              Currency
            </label>
            <input
              id="currency"
              name="currency"
              defaultValue="PKR"
              maxLength={3}
              className="mt-1 w-full rounded-md border px-3 py-2 uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="issued_at" className="block text-sm font-medium">
              Issued on
            </label>
            <input
              id="issued_at"
              name="issued_at"
              type="date"
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="due_date" className="block text-sm font-medium">
              Due date
            </label>
            <input
              id="due_date"
              name="due_date"
              type="date"
              required
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="October rent"
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Create invoice
        </button>
      </form>
    </main>
  );
}
