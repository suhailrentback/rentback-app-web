// app/admin/invoices/tools/page.tsx
import Link from "next/link";

export default async function AdminInvoiceToolsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="text-xl font-semibold mb-4">Invoice Tools</h1>

      <div className="rounded-2xl border p-4 space-y-3">
        <p className="text-sm text-gray-700">
          Mark all <strong>OPEN</strong> invoices with a due date before today as{" "}
          <strong>OVERDUE</strong>. Staff/Admin only.
        </p>

        <form method="POST" action="/admin/api/invoices/auto-overdue">
          <button
            type="submit"
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Run auto-overdue now
          </button>
        </form>

        <div className="text-xs text-gray-500">
          Tip: You can also call this endpoint from a cron/automation:
          <pre className="mt-2 rounded bg-gray-100 p-2 overflow-auto">
{`POST https://www.rentback.app/admin/api/invoices/auto-overdue`}
          </pre>
        </div>
      </div>

      <div className="mt-6">
        <Link href="/admin" className="text-sm underline">
          ← Back to Admin
        </Link>
      </div>
    </div>
  );
}
