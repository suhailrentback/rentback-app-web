// app/landlord/invoices/[id]/edit/page.tsx
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@supabase/ssr";
import EditInvoiceForm from "./EditForm.client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type InvoiceRow = {
  id: string;
  number: string | null;
  description: string | null;
  amount_cents: number | null;
  currency: string | null;
  status: "draft"|"issued"|"open"|"paid"|"overdue"|"void";
  due_date: string | null;
};

export default async function Page({ params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createServerClient(URL, ANON, {
    cookies: { get: (n: string) => cookieStore.get(n)?.value },
  });

  // Must be signed-in
  const { data: meRes } = await supabase.auth.getUser();
  if (!meRes?.user?.id) notFound();

  // Landlord or staff/admin can edit (RLS still enforced on update)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", meRes.user.id)
    .maybeSingle();

  if (!profile || !["landlord","staff","admin"].includes(String(profile.role))) {
    notFound();
  }

  // Load invoice
  const { data: inv, error } = await supabase
    .from("invoices")
    .select("id, number, description, amount_cents, currency, status, due_date")
    .eq("id", params.id)
    .maybeSingle();

  if (error || !inv) notFound();

  const invoice: InvoiceRow = {
    id: String(inv.id),
    number: inv.number ?? null,
    description: inv.description ?? null,
    amount_cents: typeof inv.amount_cents === "number" ? inv.amount_cents : 0,
    currency: inv.currency ?? "PKR",
    status: (inv.status ?? "open") as InvoiceRow["status"],
    due_date: inv.due_date ?? null,
  };

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Edit invoice</h1>
        <Link href="/landlord" className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">
          Back
        </Link>
      </div>

      <EditInvoiceForm invoice={invoice} />
    </div>
  );
}
