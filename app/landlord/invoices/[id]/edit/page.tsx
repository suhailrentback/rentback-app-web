// app/landlord/invoices/[id]/edit/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createRouteSupabase } from "@/lib/supabase/server";
import EditInvoiceForm from "./EditInvoiceForm";

export const dynamic = "force-dynamic";

type PageProps = { params: { id: string } };

export default async function Page({ params: { id } }: PageProps) {
  const supabase = createRouteSupabase();

  const { data: inv, error } = await supabase
    .from("invoices")
    .select(
      "id, number, description, status, total_amount, currency, issued_at, due_date"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !inv) notFound();

  const initial = {
    id: inv.id as string,
    number: (inv.number ?? "") as string,
    description: (inv.description ?? "") as string,
    status: String(inv.status ?? ""),
    total_amount:
      typeof inv.total_amount === "number"
        ? inv.total_amount
        : Number(inv.total_amount) || 0,
    currency: (inv.currency ?? "PKR") as string,
    issued_at: (inv.issued_at ?? null) as string | null,
    due_date: (inv.due_date ?? null) as string | null,
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/landlord/invoices"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to invoices
        </Link>
        <Link
          href="/sign-out"
          className="text-xs text-gray-500 hover:underline"
        >
          Sign out
        </Link>
      </div>

      <h1 className="text-xl font-semibold">
        Edit invoice {inv.number || inv.id.slice(0, 8)}
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Update the fields and save your changes.
      </p>

      <div className="mt-6 rounded-2xl border p-4">
        <EditInvoiceForm initial={initial} />
      </div>
    </div>
  );
}
