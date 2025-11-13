// app/admin/receipts/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type ReceiptRow = {
  id: string;
  created_at: string;
  amount_cents: number;
  currency: string | null;
  invoice_id: string | null;
  payment_id: string | null;
  tenant_id: string | null;
  invoice_number?: string | null;
  invoice_due?: string | null;
  payment_reference?: string | null;
  payment_status?: string | null;
  tenant_email?: string | null;
};

function formatMoney(cents: number | null | undefined, currency?: string | null) {
  const v = typeof cents === "number" ? cents / 100 : 0;
  const c = currency || "PKR";
  return `${v.toFixed(2)} ${c}`;
}

export default async function AdminReceiptsPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(URL, ANON, {
    cookies: { get: (n: string) => cookieStore.get(n)?.value },
  });

  // Gate: only staff/admin
  const { data: meRes } = await supabase.auth.getUser();
  const uid = meRes?.user?.id;
  if (!uid) notFound();

  // Check role safely (no recursion)
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", uid)
    .maybeSingle();

  if (!myProfile || !["staff", "admin"].includes(String(myProfile.role))) {
    notFound();
  }

  // 1) Get latest receipts (no relational casts -> fewer TS pitfalls)
  const { data: recs } = await supabase
    .from("receipts")
    .select("id, created_at, amount_cents, currency, invoice_id, payment_id, tenant_id")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows: ReceiptRow[] = Array.isArray(recs)
    ? recs.map((r: any) => ({
        id: String(r.id),
        created_at: String(r.created_at),
        amount_cents: Number(r.amount_cents ?? 0),
        currency: r.currency ?? "PKR",
        invoice_id: r.invoice_id ? String(r.invoice_id) : null,
        payment_id: r.payment_id ? String(r.payment_id) : null,
        tenant_id: r.tenant_id ? String(r.tenant_id) : null,
      }))
    : [];

  if (rows.length === 0) {
    return (
      <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Receipts</h1>
          <div className="flex gap-2">
            <Link
              href="/admin/payments"
              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Payments
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border p-6 text-sm text-gray-600">
          No receipts yet.
        </div>
      </div>
    );
  }

  // 2) Collect foreign ids to hydrate
  const invIds = [...new Set(rows.map(r => r.invoice_id).filter(Boolean))] as string[];
  const payIds = [...new Set(rows.map(r => r.payment_id).filter(Boolean))] as string[];
  const tenIds = [...new Set(rows.map(r => r.tenant_id).filter(Boolean))] as string[];

  // 3) Fetch related data in separate queries (keeps types simple)
  const [invQ, payQ, tenQ] = await Promise.all([
    invIds.length
      ? supabase.from("invoices").select("id, number, due_date").in("id", invIds)
      : Promise.resolve({ data: [] as any[] }),
    payIds.length
      ? supabase.from("payments").select("id, reference, status").in("id", payIds)
      : Promise.resolve({ data: [] as any[] }),
    tenIds.length
      ? supabase.from("profiles").select("user_id, email").in("user_id", tenIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const invMap = new Map<string, { number: string | null; due_date: string | null }>();
  for (const r of (invQ.data as any[]) ?? []) {
    invMap.set(String(r.id), { number: r.number ?? null, due_date: r.due_date ?? null });
  }

  const payMap = new Map<string, { reference: string | null; status: string | null }>();
  for (const r of (payQ.data as any[]) ?? []) {
    payMap.set(String(r.id), { reference: r.reference ?? null, status: r.status ?? null });
  }

  const tenMap = new Map<string, string | null>();
  for (const r of (tenQ.data as any[]) ?? []) {
    tenMap.set(String(r.user_id), r.email ?? null);
  }

  // 4) Hydrate rows
  for (const r of rows) {
    if (r.invoice_id && invMap.has(r.invoice_id)) {
      const i = invMap.get(r.invoice_id)!;
      r.invoice_number = i.number;
      r.invoice_due = i.due_date;
    }
    if (r.payment_id && payMap.has(r.payment_id)) {
      const p = payMap.get(r.payment_id)!;
      r.payment_reference = p.reference;
      r.payment_status = p.status;
    }
    if (r.tenant_id && tenMap.has(r.tenant_id)) {
      r.tenant_email = tenMap.get(r.tenant_id) ?? null;
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Receipts</h1>
        <div className="flex gap-2">
          <a
            href="/admin/api/receipts/export"
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Export CSV
          </a>
          <Link
            href="/admin/payments"
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Payments
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr className="text-xs uppercase text-gray-500">
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Currency</th>
              <th className="px-3 py-2">Invoice</th>
              <th className="px-3 py-2">Payment Ref</th>
              <th className="px-3 py-2">Tenant</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-3 py-2">{formatMoney(r.amount_cents, r.currency)}</td>
                <td className="px-3 py-2">{r.currency || "PKR"}</td>
                <td className="px-3 py-2">
                  {r.invoice_number ? (
                    <Link
                      href={`/tenant/invoices/${r.invoice_id}`}
                      className="underline hover:no-underline"
                    >
                      {r.invoice_number}
                    </Link>
                  ) : (
                    r.invoice_id || "—"
                  )}
                </td>
                <td className="px-3 py-2">{r.payment_reference || "—"}</td>
                <td className="px-3 py-2">{r.tenant_email || r.tenant_id || "—"}</td>
                <td className="px-3 py-2">{(r.payment_status || "").toUpperCase() || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Showing {rows.length} most recent receipts (max 200). Use Export CSV for a full offline extract.
      </p>
    </div>
  );
}
