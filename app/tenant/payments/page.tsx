// app/tenant/payments/page.tsx
// Server Component — lists the signed-in tenant's payments (RLS-scoped).
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";

type InvoiceRef = {
  id: string;
  number: string | null;
  due_date: string | null;
} | null;

type PaymentRow = {
  id: string;
  amount_cents: number;
  currency: string;
  status: string | null;
  reference: string | null;
  created_at: string;
  confirmed_at: string | null;
  invoice: InvoiceRef;
};

function fmtMoney(amountCents: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      currencyDisplay: "code",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(amountCents / 100);
  } catch {
    // Fallback for unusual/unsupported currency codes
    return `${Math.round(amountCents / 100)} ${currency}`;
  }
}

export const metadata = {
  title: "My Payments — RentBack",
};

export default async function TenantPaymentsPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const cookieStore = cookies();

  const supabase = createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        cookieStore.set(name, value, options);
      },
      remove(name: string, options: any) {
        cookieStore.set(name, "", { ...options, maxAge: 0 });
      },
    },
  });

  // RLS restricts to this tenant automatically; no need to pass user id filters here.
  const { data, error } = await supabase
    .from("payments")
    .select(
      `
        id,
        amount_cents,
        currency,
        status,
        reference,
        created_at,
        confirmed_at,
        invoice:invoices (
          id,
          number,
          due_date
        )
      `
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    // Friendly message (don't leak details)
    return (
      <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
        <h1 className="text-xl font-semibold">My Payments</h1>
        <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Couldn’t load your payments right now. Please try again.
        </p>
      </div>
    );
  }

  // Normalize potential array/object relation shape defensively.
  const rows: PaymentRow[] = (data ?? []).map((p: any) => {
    const invRaw = p?.invoice;
    const inv = Array.isArray(invRaw) ? invRaw[0] : invRaw;
    const invoice: InvoiceRef = inv
      ? {
          id: String(inv.id),
          number: inv.number == null ? null : String(inv.number),
          due_date: inv.due_date == null ? null : String(inv.due_date),
        }
      : null;

    return {
      id: String(p.id),
      amount_cents: Number(p.amount_cents) || 0,
      currency: String(p.currency || "PKR"),
      status: p.status == null ? null : String(p.status),
      reference: p.reference == null ? null : String(p.reference),
      created_at: String(p.created_at),
      confirmed_at: p.confirmed_at == null ? null : String(p.confirmed_at),
      invoice,
    };
  });

  const totalPaid = rows
    .filter((r) => (r.status || "").toLowerCase() === "confirmed")
    .reduce((acc, r) => acc + (r.amount_cents || 0), 0);

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Payments</h1>
        <Link
          href="/tenant/invoices"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to invoices
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border p-6 text-sm text-gray-600">
          No payments yet. When you submit a payment for an invoice, it will
          appear here with its status.
        </div>
      ) : (
        <>
          <div className="mb-3 text-sm text-gray-600">
            Showing <span className="font-medium">{rows.length}</span> most
            recent payments.{" "}
            <span className="ml-2">
              Total confirmed:{" "}
              <span className="font-medium">
                {rows.length > 0
                  ? fmtMoney(
                      totalPaid,
                      rows[0]?.currency ? rows[0].currency : "PKR"
                    )
                  : "-"}
              </span>
            </span>
          </div>

          <ul className="space-y-3">
            {rows.map((r) => {
              const inv = r.invoice;
              const invHref =
                inv && inv.id ? `/tenant/invoices/${inv.id}` : undefined;
              const created = new Date(r.created_at).toDateString();
              const status = (r.status || "").toUpperCase();

              return (
                <li
                  key={r.id}
                  className="rounded-xl border p-4 hover:bg-gray-50"
                >
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm text-gray-600">
                        {inv?.number ? (
                          <>
                            Invoice{" "}
                            {invHref ? (
                              <Link
                                href={invHref}
                                className="font-medium text-blue-600 hover:underline"
                              >
                                {inv.number}
                              </Link>
                            ) : (
                              <span className="font-medium">{inv.number}</span>
                            )}
                          </>
                        ) : (
                          <span className="font-medium">Unlinked invoice</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {r.reference ? `Ref: ${r.reference} • ` : ""}
                        Created {created}
                        {inv?.due_date
                          ? ` • Invoice due ${new Date(
                              inv.due_date
                            ).toDateString()}`
                          : ""}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-3 md:mt-0">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          status === "CONFIRMED"
                            ? "bg-green-100 text-green-700"
                            : status === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                        title={status || "—"}
                      >
                        {status || "—"}
                      </span>
                      <span className="font-semibold">
                        {fmtMoney(r.amount_cents, r.currency)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
