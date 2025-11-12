// app/admin/payments/page.tsx
import { createRouteSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Row = {
  id: string;
  amount_cents: number | null;
  currency: string | null;
  status: string | null;
  reference: string | null;
  created_at: string | null;
  confirmed_at: string | null;
  invoice: { id: string; number: string | null; due_date: string | null } | null;
};

async function requireStaff() {
  const sb = createRouteSupabase();
  const { data: auth } = await sb.auth.getUser();
  const uid = auth.user?.id ?? null;
  if (!uid) return null;

  const { data: me } = await sb
    .from("profiles")
    .select("id, role, email")
    .eq("id", uid)
    .maybeSingle();

  if (!me) return null;
  if (!["staff", "admin"].includes(String(me.role))) return null;

  return { uid, role: String(me.role), email: String((me as any).email ?? "") };
}

async function loadSubmitted(): Promise<Row[]> {
  const sb = createRouteSupabase();
  const { data } = await sb
    .from("payments")
    .select(
      `
      id, amount_cents, currency, status, reference, created_at, confirmed_at,
      invoice:invoices (
        id, number, due_date
      )
    `
    )
    .in("status", ["submitted", "confirmed"])
    .order("created_at", { ascending: false })
    .limit(200);

  return (data as Row[]) ?? [];
}

export default async function AdminPaymentsPage() {
  const staff = await requireStaff();
  if (!staff) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-xl font-semibold">Not permitted</h1>
        <p className="mt-2 text-sm text-gray-600">
          This page is for staff/admin only.
        </p>
      </div>
    );
  }

  const rows = await loadSubmitted();

  return (
    <div className="mx-auto w-full max-w-4xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Payments — Confirmations</h1>
        <a
          href="/landlord"
          className="text-sm text-gray-600 underline hover:text-gray-900"
        >
          Back
        </a>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border p-4 text-sm text-gray-600">
          No submitted payments right now.
        </div>
      ) : (
        <div className="divide-y rounded-xl border">
          {rows.map((r) => {
            const amt =
              typeof r.amount_cents === "number"
                ? (r.amount_cents / 100).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "—";
            const invLabel = r.invoice
              ? (r.invoice.number ?? r.invoice.id).toString().slice(0, 24)
              : "—";

            return (
              <div key={r.id} className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium">
                    {amt} {r.currency ?? "PKR"} • Ref: {r.reference ?? "—"}
                  </div>
                  <div className="text-xs text-gray-600">
                    Invoice: {invLabel}{" "}
                    {r.invoice?.due_date ? `• Due ${new Date(r.invoice.due_date).toDateString()}` : ""}
                  </div>
                  <div className="text-xs text-gray-600">
                    Status: {(r.status ?? "").toUpperCase()}{" "}
                    {r.confirmed_at ? `• Confirmed ${new Date(r.confirmed_at).toDateString()}` : ""}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {String(r.status) === "submitted" ? (
                    <form method="post" action="/admin/api/payments/confirm">
                      <input type="hidden" name="paymentId" value={r.id} />
                      <button
                        type="submit"
                        className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        Confirm
                      </button>
                    </form>
                  ) : (
                    <a
                      href={`/tenant/invoices/${r.invoice?.id ?? ""}`}
                      className="text-sm text-gray-600 underline hover:text-gray-900"
                    >
                      View invoice
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        Confirming sets payment to <b>CONFIRMED</b> and marks the invoice <b>PAID</b>.
        Receipts & emails ship in the next step.
      </div>
    </div>
  );
}
