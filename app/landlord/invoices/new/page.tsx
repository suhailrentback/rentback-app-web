import Link from "next/link";
import NewInvoiceForm from "./NewInvoiceForm";

export default function NewInvoicePage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Create invoice</h1>
        <Link href="/landlord" className="text-sm underline">
          Back to landlord dashboard
        </Link>
      </div>

      <p className="text-sm text-gray-600">
        Issue an invoice to a tenant by email. Amount is in whole currency units (e.g., 25000 PKR).
      </p>

      <NewInvoiceForm />
    </div>
  );
}
