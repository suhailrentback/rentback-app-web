// app/tenant/invoices/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Row = {
  id: string;
  number: string | null;
  status: string | null;
  issued_at: string | null;
  due_date: string | null;
  amount_cents: number | null;
  currency: string | null;
};

function Banner({ ok, error }: { ok?: string; error?: string }) {
  if (ok === "payment_submitted") {
    return (
      <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
        ✅ Payment submitted. We’ll mark it confirmed after verification.
      </div>
    );
  }
  if (error) {
    return (
      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
        ⚠️ {error}
      </div>
    );
  }
  return null;
}

export default async function TenantInvoiceDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const cookieStore = cookies();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: { get: (n: string) => cookieStore.get(n)?.value },
  });

  const { data: me } = await supabase.auth.getUser();
  if (!me?.user) notFound();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("id, number, status, issued_at, due_date, amount_cents, currency")
    .eq("id", params.id)
    .maybeSingle<Row>();

  if (error || !invoice) notFound();

  const isPaid = String(invoice.status ?? "").toLowerCase() === "paid";
  const total = (invoice.amount_cents ?? 0) / 100;
  const currency = invoice.currency ?? "PKR";

  const ok = (searchParams["ok"] as string | undefined) || undefined;
  const err = (searchParams["error"] as string | undefined) || undefined;

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <div className="mb-4">
        <Link href="/tenant/invoices" className="text-sm underline hover:no-underline">
          ← Back to invoices
        </Link>
      </div>

      <Banner ok={ok} error={err} />

      <div className="rounded-2xl border p-4 md:p-6">
        <h1 className="text-xl font-semibold mb-1">
          Invoice {invoice.number ?? invoice.id.slice(0, 8)}
        </h1>
        <p className="text-sm text-gray-600 mb-4">
          {isPaid ? "PAID" : "OPEN"} · Total: {total} {currency}
        </p>

        <div className="flex flex-wrap gap-3">
          <a
            href={`/api/tenant/invoices/${invoice.id}/pdf`}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Download invoice (PDF)
          </a>
          <a
            href={`/api/tenant/invoices/${invoice.id}/receipt`}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Download receipt (PDF)
          </a>
          {!isPaid && (
            <Link
              href={`/tenant/invoices/${invoice.id}/pay`}
              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Pay now
            </Link>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          <div>
            <div className="text-gray-500">Issued</div>
            <div>{invoice.issued_at ? new Date(invoice.issued_at).toDateString() : "—"}</div>
          </div>
          <div>
            <div className="text-gray-500">Due</div>
            <div>{invoice.due_date ? new Date(invoice.due_date).toDateString() : "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
