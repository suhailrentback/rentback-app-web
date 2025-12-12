// app/tenant/points/page.tsx
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

type LedgerRow = {
  id: string;
  delta_points: number;
  reason: string;
  created_at: string;
};

export const metadata = { title: "Points History — RentBack" };

function fmtReason(reason: string) {
  // e.g. "earn:payment:<id>" or "redeem:offer:<id>"
  if (reason?.startsWith("earn:payment:")) return "Earned from payment";
  if (reason?.startsWith("redeem:offer:")) return "Redeemed for offer";
  return reason || "—";
}

export default async function PointsPage() {
  const sb = await createClient(cookies());
  const { data, error } = await sb
    .from("reward_ledger")
    .select("id, delta_points, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows: LedgerRow[] = error ? [] : ((data as any) ?? []);

  const balance = rows.reduce((sum, r) => sum + (r.delta_points ?? 0), 0);

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Points history</h1>

      <section className="rounded-xl border p-4 bg-white/60 dark:bg-black/20">
        <div className="text-sm opacity-75">Current balance</div>
        <div className="text-3xl font-bold tabular-nums">{balance.toLocaleString()}</div>
      </section>

      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-black/5 dark:bg-white/5">
            <tr>
              <th className="text-left p-3">When</th>
              <th className="text-left p-3">Reason</th>
              <th className="text-right p-3">Points</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 opacity-60">
                  No entries yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">
                  {new Date(r.created_at).toLocaleString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="p-3">{fmtReason(r.reason)}</td>
                <td className="p-3 text-right font-mono">
                  {r.delta_points > 0 ? `+${r.delta_points}` : r.delta_points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
