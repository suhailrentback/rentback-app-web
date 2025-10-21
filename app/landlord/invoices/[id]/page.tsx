// app/landlord/invoices/new/page.tsx
import Link from "next/link";
import NewInvoiceForm from "@/components/landlord/NewInvoiceForm";

export default function NewInvoicePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Create invoice</h1>
      <p className="text-sm text-gray-600">
        Fill the form to create a new invoice for a tenant.
      </p>

      <NewInvoiceForm />

      <div>
        <Link href="/landlord/invoices" className="text-sm text-blue-600 hover:underline">
          ← Back to invoices
        </Link>
      </div>
    </main>
  );
}
