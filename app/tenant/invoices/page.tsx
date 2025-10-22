// app/tenant/invoices/page.tsx
import Link from "next/link";
import InvoicesClient from "@/components/tenant/InvoicesClient";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function TenantInvoicesPage() {
  const supabase = createServerSupabase();

  // RLS will scope to the signed-in tenant automatically
  const { data, error } = await supabase
    .from("invoices")
    .select("id, number, status, issued_at, due_date, total_amount, currency, description")
    .order("issued_at", { ascending: false });

  const invoices = Array.isArray(data) ? data : [];

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <p className="text-sm text-gray-600">
          Transparent amounts, clear status, quick receipts (when paid).
        </p>
        <div>
          <Link href="/tenant" className="text-sm text-blue-600 hover:underline">
            Back to dashboard
          </Link>
        </div>
        {error && (
          <p className="text-sm text-red-600">
            Failed to load invoices. Please try again.
          </p>
        )}
      </header>

      <InvoicesClient invoices={invoices as any} />
    </main>
  );
}
