// app/admin/receipts/page.tsx
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Row = {
  id: string;
  created_at: string | null;
  invoice_id: string | null;
  payment_id: string | null;
  invoice?: { id: string; number: string | number } | null;
  payment?: { id: string; reference: string | null } | null;
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "2-digit" }).format(
      new Date(iso)
    );
  } catch {
    return iso.slice(0, 10);
  }
}

export default async function AdminReceiptsPage() {
  const jar = cookies();
  const sb = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      get: (n: string) => jar.get(n)?.value,
      set() {},
      remove() {},
    },
  });

  // guard: only staff/admin — RLS/middleware should already enforce
  const { data, error } = await sb
    .from("receipts")
    .select(
      `
      id, created_at, invoice_id, payment_id,
      invoice:invoices ( id, number ),
      payment:payments ( id, reference )
    `
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-5xl p-6">
        <h1 className="text-xl font-semibold">Receipts</h1>
        <p className="mt-4 text-sm text-red-600">Failed to load: {error.message}</p>
      </div>
    );
  }

  const rows: Row[] = ((data as any[]) || []).map((r: any) => {
    const inv = Array.isArray(r.invoice) ? r.invoice[0] : r.invoice;
    const pay = Array.isArray(r.payment) ? r.payment[0] : r.payment;
    return {
      id: r.id,
      created_at: r.created_at ?? null,
      invoice_id: r.invoice_id ?? inv?.id ?? null,
      payment_id: r.payment_id ?? pay?.id ?? null,
      invoice: inv ? { id: String(inv.id), number: inv.number } : null,
      payment: pay ? { id: String(pay.id), reference: pay.reference ?? null } : null,
    };
  });

  return (
    <div className="mx-auto w-full max-w-5xl p-6">
      <h1 className="text-xl font-semibold">Receipts</h1>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No receipts yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Payment Ref</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3">{fmtDate(r.created_at)}</td>
                  <td className="px-4 py-3">{r.invoice ? String(r.invoice.number) : "—"}</td>
                  <td className="px-4 py-3">{r.payment?.reference || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {r.invoice_id ? (
                        <a
                          href={`/api/tenant/invoices/${r.invoice_id}/receipt`}
                          className="rounded-xl border px-3 py-1.5 hover:bg-gray-50"
                        >
                          Download PDF
                        </a>
                      ) : (
                        <span className="rounded-xl border px-3 py-1.5 text-gray-300">Download</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
