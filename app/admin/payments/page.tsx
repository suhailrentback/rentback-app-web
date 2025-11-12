// app/admin/payments/page.tsx
import { createRouteSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

export const runtime = "nodejs";

// ---- Types kept intentionally simple to avoid TS friction with nested selects
type PaymentRow = {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  reference: string | null;
  created_at: string;
  confirmed_at: string | null;
  invoice_id: string | null;
};

async function requireStaffOrAdmin() {
  const sb = createRouteSupabase();
  const { data: auth } = await sb.auth.getUser();
  const uid = auth.user?.id ?? null;

  if (!uid) return null;

  const { data: me } = await sb
    .from("profiles")
    .select("id, role, email")
    .eq("id", uid)
    .maybeSingle();

  if (!me || !["staff", "admin"].includes(me.role)) return null;
  return me as { id: string; role: "staff" | "admin"; email: string };
}

async function loadPendingPayments(): Promise<PaymentRow[]> {
  const sb = createRouteSupabase();

  const { data, error } = await sb
    .from("payments")
    .select("id, amount_cents, currency, status, reference, created_at, confirmed_at, invoice_id")
    .neq("status", "confirmed")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) return [];
  return data as unknown as PaymentRow[];
}

// ---- SERVER ACTION: confirm a payment (no return value; keeps Next happy)
export async function confirmPaymentAction(formData: FormData) {
  "use server";
  const paymentId = String(formData.get("paymentId") ?? "");
  if (!paymentId) return;

  const sb = createRouteSupabase();

  // Role check
  const { data: auth } = await sb.auth.getUser();
  const uid = auth.user?.id ?? null;
  if (!uid) return;

  const { data: me } = await sb
    .from("profiles")
    .select("id, role")
    .eq("id", uid)
    .maybeSingle();

  if (!me || !["staff", "admin"].includes((me as any).role)) return;

  // Mark payment confirmed (only if not already)
  const nowIso = new Date().toISOString();
  const { data: payment, error: payErr } = await sb
    .from("payments")
    .update({ status: "confirmed", confirmed_at: nowIso })
    .eq("id", paymentId)
    .neq("status", "confirmed")
    .select("id, invoice_id, amount_cents, currency")
    .maybeSingle();

  if (payErr || !payment) {
    // nothing else to do; keep page stable
    revalidatePath("/admin/payments");
    return;
  }

  const invoiceId = (payment as any).invoice_id as string | null;

  // Flip invoice to PAID (simple MVP rule)
  if (invoiceId) {
    await sb.from("invoices").update({ status: "paid" }).eq("id", invoiceId);
  }

  // Create a receipt row (append-only)
  if (invoiceId) {
    await sb
      .from("receipts")
      .insert({
        invoice_id: invoiceId,
        payment_id: paymentId,
        issued_at: nowIso,
        pdf_url: null,
      });
  }

  // Audit (best-effort; ignore failures)
  try {
    const { writeAuditLog } = await import("@/lib/server/audit");
    await writeAuditLog({
      supabase: sb,
      entityTable: "payments",
      entityId: paymentId,
      action: "payment.confirm",
      metadata: {
        invoice_id: invoiceId,
        amount_cents: (payment as any).amount_cents,
        currency: (payment as any).currency,
      },
    });
    if (invoiceId) {
      await writeAuditLog({
        supabase: sb,
        entityTable: "invoices",
        entityId: invoiceId,
        action: "invoice.update",
        metadata: { status: "paid" },
      });
    }
  } catch {
    // ignore
  }

  revalidatePath("/admin/payments");
}

export default async function AdminPaymentsPage() {
  const me = await requireStaffOrAdmin();
  if (!me) {
    // Friendly block (mirrors our Not Permitted)
    return (
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="text-xl font-semibold">Not permitted</h1>
        <p className="mt-2 text-sm text-gray-600">
          This page is only for Admin/Staff.
        </p>
      </div>
    );
  }

  const rows = await loadPendingPayments();

  return (
    <div className="mx-auto w-full max-w-4xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Payments (Pending)</h1>
        <a
          href="/sign-out"
          className="text-sm text-gray-600 underline hover:text-gray-900"
        >
          Sign out
        </a>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border p-4 text-sm text-gray-600">
          No pending payments.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 font-medium">Created</th>
                <th className="px-3 py-2 font-medium">Payment ID</th>
                <th className="px-3 py-2 font-medium">Invoice</th>
                <th className="px-3 py-2 font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{r.id}</td>
                  <td className="px-3 py-2 text-xs">{r.invoice_id ?? "—"}</td>
                  <td className="px-3 py-2">
                    {(r.amount_cents / 100).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {r.currency}
                  </td>
                  <td className="px-3 py-2">{r.status.toUpperCase()}</td>
                  <td className="px-3 py-2">
                    <form action={confirmPaymentAction}>
                      <input type="hidden" name="paymentId" value={r.id} />
                      <button
                        type="submit"
                        className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                        disabled={r.status === "confirmed"}
                      >
                        Confirm
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-500">
        Confirm → sets payment to <b>CONFIRMED</b>, invoice to <b>PAID</b>,
        writes a receipt, and logs to audit.
      </p>
    </div>
  );
}
