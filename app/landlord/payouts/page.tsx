// app/landlord/payouts/page.tsx
import React from "react";

export const dynamic = "force-dynamic";

export default async function LandlordPayoutsPage() {
  // NOTE: For now we render a safe, zero-DB UI.
  // We’ll wire live Supabase balance in 4.7/4.8.
  const eligibleCents = 0; // placeholder until ledger calc is wired
  const eligible = (eligibleCents / 100).toFixed(2);

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-2">Payouts</h1>
      <p className="text-sm text-gray-500 mb-6">
        Request a payout of your confirmed, not-yet-settled rent. Eligible
        balance will appear here once ledger data is wired.
      </p>

      <div className="rounded-2xl border p-4 md:p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Eligible balance</div>
            <div className="text-3xl font-bold">€{eligible}</div>
          </div>
          <div className="text-xs text-gray-400">
            (Live calculation connects in 4.8)
          </div>
        </div>
      </div>

      <form
        className="rounded-2xl border p-4 md:p-6 space-y-4"
        method="POST"
        action="/landlord/api/payouts/request"
      >
        <div>
          <label className="block text-sm font-medium mb-1">
            Amount (EUR)
          </label>
          <input
            type="number"
            name="amount"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Tip: You can request up to your eligible balance. We’ll cap and
            validate on the server.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Reference / Notes (optional)
          </label>
          <input
            type="text"
            name="notes"
            maxLength={200}
            placeholder="e.g., November rents"
            className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2"
          />
        </div>

        <button
          type="submit"
          className="rounded-2xl px-4 py-2 font-medium shadow-sm border hover:shadow-md active:scale-[0.99]"
        >
          Request Payout
        </button>

        <p className="text-xs text-gray-500">
          After you submit, your request will appear for Admin review. You’ll
          get an email on decision (approve/deny).
        </p>
      </form>
    </div>
  );
}
