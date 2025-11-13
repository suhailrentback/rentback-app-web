// app/tenant/payments/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function formatAmount(cents: any, currency: any) {
  const n = typeof cents === "number" ? cents : Number(cents ?? 0);
  const cur = String(currency ?? "PKR").toUpperCase();
  return `${(n / 100).toFixed(2)} ${cur}`;
}

export default async function TenantPaymentsPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const statusParam = typeof searchParams?.status === "string" ? searchParams!.status : "all";

  const cookieStore = cookies();
  const supabase = createServerClient(URL, ANON, {
    cookies: { get: (n: string) => cookieStore.get(n)?.value },
  });

  // Auth + role check (tenant)
  const { data: me } = await supabase.auth.getUser();
  if (!me?.user?.id) notFound();

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", me.user.id)
    .maybeSingle();

  if (!prof || String(prof.role) !== "tenant") {
    // Only tenants can see this page (friendly deny)
    notFound();
  }

  // Build query (RLS ensures tenant scope)
  let query = supabase
    .from("payments")
    .select(
      // NOTE: keep join tolerant; we alias as "invoice"
      "id, amount_cents, currency, status, reference, created_at, confirmed_at, invoice_id, invoice:invoices ( id, number, due_date )"
    )
    .eq("tenant_id", me.user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (statusParam && statusParam !== "all") {
    query = query.eq("status", statusParam);
  }

  const { data, error } = await query;

  const rows: any[] = Array.isArray(data) ? data : [];

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">My payments</h1>
        <Link href="/tenant" className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">Back to tenant</Link>
      </div>

      {/* Filters */}
      <div className="mb-3 flex gap-2 text-sm">
        {["all","pending","confirmed","failed"].map((s) => {
          const active = (statusParam || "all") === s;
          return (
            <Link
              key={s}
              href={`/tenant/payments?status=${s}`}
              className={`rounded-full border px-3 py-1 ${active ? "bg-gray-100" : "hover:bg-gray-50"}`}
            >
              {s.toUpperCase()}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Reference</th>
              <th className="px-3 py-2 font-medium">Invoice</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                  {error ? "Could not load payments." : "No payments yet"}
                </td>
              </tr>
            )}

            {rows.map((r) => {
              const created = r?.created_at ? new Date(r.created_at) : null;
              const inv = (() => {
                const v = (r as any).invoice;
                if (!v) return null;
                if (Array.isArray(v)) return v[0] ?? null;
                return v;
              })();
              const invoiceLink = inv?.id ? `/tenant/invoices/${inv.id}` : null;

              return (
                <tr key={String(r.id)} className="border-t">
                  <td className="px-3 py-2">{created ? created.toDateString() : "-"}</td>
                  <td className="px-3 py-2">{r?.reference ?? "-"}</td>
                  <td className="px-3 py-2">
                    {invoiceLink ? (
                      <Link className="underline" href={invoiceLink}>
                        {inv?.number ?? inv?.id ?? "View"}
                      </Link>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{String(r?.status ?? "-").toUpperCase()}</td>
                  <td className="px-3 py-2 text-right">
                    {formatAmount(r?.amount_cents, r?.currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Showing up to 100 most recent payments. Filters are applied server-side; pagination coming later.
      </p>
    </div>
  );
}
