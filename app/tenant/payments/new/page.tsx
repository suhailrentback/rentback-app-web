// app/tenant/payments/new/page.tsx
import { createRouteSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

type OpenInvoice = {
  id: string;
  number: string | null;
  amount_cents: number | null;
  currency: string | null;
  due_date: string | null;
  status: string | null;
};

async function requireTenantId() {
  const sb = createRouteSupabase();
  const { data: auth } = await sb.auth.getUser();
  const uid = auth.user?.id ?? null;
  if (!uid) return null;

  // We only require that a profile exists; role can be tenant/landlord/staff/admin,
  // but the critical check is invoice ownership in the action.
  const { data: me } = await sb
    .from("profiles")
    .select("id, role, email")
    .eq("id", uid)
    .maybeSingle();

  if (!me) return null;
  return uid as string;
}

async function loadOpenInvoices(tenantId: string): Promise<OpenInvoice[]> {
  const sb = createRouteSupabase();
  // We treat OPEN (or UNPAID/ISSUED if present) as payable.
  const { data, error } = await sb
    .from("invoices")
    .select("id, number, amount_cents, currency, due_date, status")
    .eq("tenant_id", tenantId)
    .in("status", ["open", "issued", "unpaid"])
    .order("issued_at", { ascending: false })
    .limit(100);

  if (error || !data) return [];
  return data as unknown as OpenInvoice[];
}

// ---------- SERVER ACTION ----------
async function createPaymentAction(formData: FormData) {
  "use server";

  const sb = createRouteSupabase();
  const { data: auth } = await sb.auth.getUser();
  const uid = auth.user?.id ?? null;
  if (!uid) {
    // Not logged in -> bounce to sign-in
    redirect("/sign-in");
    return;
  }

  // Read and sanitize form values
  const invoiceId = String(formData.get("invoiceId") ?? "").trim();
  const amountStr = String(formData.get("amount") ?? "").trim();
  const reference = String(formData.get("reference") ?? "").trim().slice(0, 80);

  // Basic validation
  if (!invoiceId || !amountStr) {
    redirect("/tenant/payments/new?error=invalid");
  }

  const amountNumber = Number(amountStr.replace(/,/g, ""));
  if (!isFinite(amountNumber) || amountNumber <= 0) {
    redirect("/tenant/payments/new?error=amount");
  }

  // Convert to minor units (cents)
  const amount_cents = Math.round(amountNumber * 100);

  // Verify the invoice belongs to this user and is payable
  const { data: invoice } = await sb
    .from("invoices")
    .select("id, tenant_id, amount_cents, currency, status")
    .eq("id", invoiceId)
    .in("status", ["open", "issued", "unpaid"])
    .maybeSingle();

  if (!invoice || invoice.tenant_id !== uid) {
    redirect("/tenant/payments/new?error=not_owned");
  }

  // (MVP) allow partial or full; use invoice currency
  const currency = (invoice as any).currency ?? "PKR";

  // Insert the payment under tenant RLS (policy requires tenant_id = auth.uid())
  const { error: insertErr } = await sb.from("payments").insert({
    tenant_id: uid,
    invoice_id: invoiceId,
    amount_cents,
    currency,
    status: "submitted",
    reference: reference || null,
  });

  if (insertErr) {
    // Keep it simple for the MVP; you can inspect server logs if needed.
    redirect("/tenant/payments/new?error=insert_failed");
  }

  // Success → go to payments list
  redirect("/tenant/payments");
}

export default async function NewPaymentPage() {
  const uid = await requireTenantId();
  if (!uid) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="text-xl font-semibold">Not permitted</h1>
        <p className="mt-2 text-sm text-gray-600">
          Please sign in as a tenant to create a payment.
        </p>
        <div className="mt-4">
          <a
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            href="/sign-in"
          >
            Go to sign in
          </a>
        </div>
      </div>
    );
  }

  const invoices = await loadOpenInvoices(uid);

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Make a Payment</h1>
        <a
          href="/tenant/payments"
          className="text-sm text-gray-600 underline hover:text-gray-900"
        >
          Back to payments
        </a>
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-xl border p-4 text-sm text-gray-600">
          You have no open invoices to pay.
        </div>
      ) : (
        <form action={createPaymentAction} className="space-y-4 rounded-xl border p-4">
          <div>
            <label className="block text-sm font-medium">Invoice</label>
            <select
              name="invoiceId"
              required
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              defaultValue={invoices[0]?.id}
            >
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {(inv.number ?? inv.id).toString().slice(0, 24)} •{" "}
                  {inv.amount_cents
                    ? (inv.amount_cents / 100).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "—"}{" "}
                  {inv.currency ?? "PKR"}{" "}
                  {inv.due_date ? `• Due ${new Date(inv.due_date).toDateString()}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">
              Amount (enter number, e.g. 25000)
            </label>
            <input
              type="text"
              inputMode="decimal"
              name="amount"
              placeholder="Amount"
              required
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Tip: Enter full amount from your invoice. Decimals are allowed.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium">Reference (optional)</label>
            <input
              type="text"
              name="reference"
              placeholder="e.g. Bank transfer ref"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              maxLength={80}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Submit payment
            </button>
            <a
              href="/tenant/payments"
              className="text-sm text-gray-600 underline hover:text-gray-900"
            >
              Cancel
            </a>
          </div>

          <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
            After you submit, our team will verify your transfer. Once confirmed,
            the invoice is marked PAID and a receipt is generated.
          </div>
        </form>
      )}
    </div>
  );
}
