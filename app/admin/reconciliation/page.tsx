// app/admin/reconciliation/page.tsx
export const dynamic = "force-dynamic";

export default async function AdminReconciliationPage() {
  // Server component; simple GET form to the export API
  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-2">Reconciliation Export (CSV)</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Export landlord ledger entries (credits/debits) with running balance. Staff/Admin only.
      </p>

      <form
        className="grid gap-4 rounded-2xl border p-4 md:p-6"
        action="/admin/api/reconciliation/export"
        method="GET"
        target="_blank"
      >
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="landlordEmail">Landlord email (optional)</label>
          <input id="landlordEmail" name="landlordEmail" type="email" placeholder="owner@example.com" className="w-full rounded-xl border p-2" />
          <p className="text-xs text-muted-foreground">Or use landlord ID below.</p>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="landlordId">Landlord ID (optional)</label>
          <input id="landlordId" name="landlordId" type="text" placeholder="uuid" className="w-full rounded-xl border p-2" />
          <p className="text-xs text-muted-foreground">If both email and ID are provided, ID wins.</p>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="currency">Currency (optional)</label>
            <input id="currency" name="currency" type="text" placeholder="PKR" className="w-full rounded-xl border p-2" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="dateFrom">From (optional)</label>
            <input id="dateFrom" name="dateFrom" type="date" className="w-full rounded-xl border p-2" />
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="dateTo">To (optional)</label>
            <input id="dateTo" name="dateTo" type="date" className="w-full rounded-xl border p-2" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">&nbsp;</label>
            <button
              type="submit"
              className="w-full rounded-2xl border px-4 py-2 font-medium hover:bg-muted"
            >
              Export CSV
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Tip: Leave all filters empty to export everything (up to limits). Running balance is computed per landlord & currency.
        </p>
      </form>
    </div>
  );
}
