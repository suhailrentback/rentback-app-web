import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

type BalanceRow = { landlord_id: string; balance_cents: number };

function formatMoney(cents: number, currency = "EUR") {
  const amt = (cents ?? 0) / 100;
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amt);
}

export default async function LandlordLedgerPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  // get user
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Landlord Ledger</h1>
        <p className="mt-4 text-red-600">Please sign in.</p>
      </div>
    );
  }

  // balance
  const { data: bal, error: balErr } = await supabase
    .from("v_landlord_balance")
    .select("*")
    .eq("landlord_id", user.id)
    .maybeSingle<BalanceRow>();

  // recent entries
  const { data: entries, error: listErr } = await supabase
    .from("v_landlord_ledger_enriched")
    .select("id, created_at, amount_cents, entry_type, reference_type, reference_id, payout_status, notes")
    .eq("landlord_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const balanceCents = bal?.balance_cents ?? 0;

  return (
    <div className="mx-auto w-full max-w-5xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Landlord Ledger</h1>
        <a
          href="/landlord/api/ledger/export"
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Export CSV
        </a>
      </div>

      <div className="mt-4 rounded-2xl border p-4">
        <div className="text-sm text-gray-500">Available balance</div>
        <div className="text-3xl font-bold">{formatMoney(balanceCents)}</div>
      </div>

      {(balErr || listErr) && (
        <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-red-700">
          {(balErr?.message || listErr?.message) ?? "Failed to load ledger."}
        </div>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left">
            <tr className="border-b">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Reference</th>
              <th className="py-2 pr-4">Amount</th>
              <th className="py-2 pr-4">Notes</th>
            </tr>
          </thead>
          <tbody>
            {(entries ?? []).map((r: any) => {
              const ref =
                r.reference_type && r.reference_id
                  ? `${r.reference_type}:${r.reference_id}`
                  : "—";
              const dt = r.created_at ? new Date(r.created_at) : null;
              return (
                <tr key={r.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="py-2 pr-4">{dt ? dt.toLocaleString() : "—"}</td>
                  <td className="py-2 pr-4">
                    <span className="rounded-full border px-2 py-0.5 text-xs">
                      {r.entry_type || "entry"}
                    </span>
                  </td>
                  <td className="py-2 pr-4">{ref}</td>
                  <td className="py-2 pr-4 font-medium">
                    {formatMoney(r.amount_cents)}
                  </td>
                  <td className="py-2 pr-4">{r.notes || "—"}</td>
                </tr>
              );
            })}
            {(!entries || entries.length === 0) && (
              <tr>
                <td className="py-6 text-gray-500" colSpan={5}>
                  No ledger entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
