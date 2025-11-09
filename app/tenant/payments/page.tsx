// app/tenant/payments/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

type Profile = {
  id: string;
  email: string | null;
  role: "tenant" | "landlord" | "staff" | "admin";
};

type PaymentRow = {
  id: string;
  invoice_id: string | null;
  amount_cents: number | null;
  currency: string | null;
  reference: string | null;
  status: "submitted" | "confirmed" | "rejected" | "pending" | "failed";
  created_at: string;
};

function getSupabaseServer() {
  const store = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );
}

export default async function TenantPaymentsPage() {
  const supabase = getSupabaseServer();

  // Guard: must be signed in
  const { data: userResp } = await supabase.auth.getUser();
  const user = userResp?.user;
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, email")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  // Attempt to load payments scoped to this tenant.
  // NOTE: If the `payments` table isn’t present yet or RLS denies, we degrade gracefully.
  let payments: PaymentRow[] = [];
  let pErr: any = null;

  try {
    const { data, error } = await supabase
      .from("payments")
      .select(
        "id, invoice_id, amount_cents, currency, reference, status, created_at"
      )
      .eq("tenant_id", profile?.id ?? "__none__")
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<PaymentRow[]>();
    payments = data ?? [];
    pErr = error ?? null;
  } catch (e: any) {
    pErr = e;
  }

  const blocked =
    pErr && (pErr.code === "42501" || pErr.message?.includes("permission"));

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold">My Payments</h1>

      {blocked ? (
        <p className="mt-2 text-sm text-gray-600">
          Payments history will appear here once access is enabled.
        </p>
      ) : payments.length === 0 ? (
        <p className="mt-2 text-sm text-gray-600">No payments yet.</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Reference</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const when = new Date(p.created_at).toDateString();
                const amount =
                  typeof p.amount_cents === "number"
                    ? (p.amount_cents / 100).toFixed(2)
                    : "—";
                const ccy = p.currency ?? "";
                return (
                  <tr key={p.id} className="border-t">
                    <td className="px-3 py-2">{when}</td>
                    <td className="px-3 py-2">{p.reference ?? "—"}</td>
                    <td className="px-3 py-2">
                      {amount} {ccy}
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded-full border px-2 py-0.5 text-xs">
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-500">
        Need help? support@rentback.app
      </p>
    </div>
  );
}
