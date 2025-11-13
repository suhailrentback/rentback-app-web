// app/tenant/invoices/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function TenantInvoicePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const id = params.id;
  const cookieStore = cookies();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { get: (n: string) => cookieStore.get(n)?.value },
  });

  const { data: me } = await supabase.auth.getUser();
  if (!me?.user) notFound();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("id, number, status, issued_at, due_date, total_amount, currency, tenant_id")
    .eq("id", id)
    .eq("tenant_id", me.user.id)
    .maybeSingle();

  if (error || !invoice) notFound();

  const isPaid = String(invoice.status ?? "").toLowerCase() === "paid";
  const invoiceUrl = `/api/tenant/invoices/${invoice.id}/pdf`;
  const receiptUrl = `/api/tenant/invoices/${invoice.id}/receipt`;
  const payOk = searchParams?.pay === "ok";

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <div className="mb-4">
        <Link href="/tenant/invoices" className="text-sm underline hover:no-underline">
          ← Back to invoices
        </Link>
      </div>

      {payOk ? (
        <div className="mb-4 rounded-xl border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          Payment submitted. An admin will review and confirm soon.
        </div>
      ) : null}

      <h1 className="mb-1 text-xl font-semibold">Invoice {invoice.number}</h1>
      <p className="mb-6 text-sm text-gray-600">
        {isPaid ? "PAID" : "OPEN"} · Total: {Number(invoice.total_amount ?? 0).toFixed(2)} {invoice.currency || "PKR"}
      </p>

      <div className="mb-4 flex flex-wrap gap-3">
        <a
          href={invoiceUrl}
          className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
        >
          Download invoice (PDF)
        </a>
        <a
          href={receiptUrl}
          className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
        >
          Download receipt (PDF)
        </a>

        {!isPaid && (
          <Link
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
            href={`/tenant/invoices/${invoice.id}/pay`}
          >
            Pay now
          </Link>
        )}
      </div>

      <div className="rounded-2xl border p-4 text-sm">
        <div>Issued: {new Date(String(invoice.issued_at)).toDateString()}</div>
        <div>Due: {new Date(String(invoice.due_date)).toDateString()}</div>
      </div>
    </div>
  );
}
