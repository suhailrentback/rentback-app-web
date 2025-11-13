// app/admin/invoices/tools/page.tsx
import Link from "next/link";

export default async function AdminInvoiceToolsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Invoice Tools</h1>
        <Link href="/admin" className="text-sm underline">
          ← Back to Admin
        </Link>
      </div>

      <div className="rounded-2xl border p-4 space-y-3">
        <p className="text-sm text-gray-700">
          Mark all <strong>OPEN</strong> invoices with a due date before today as{" "}
          <strong>OVERDUE</strong>. Staff/Admin only.
        </p>

        <div className="flex items-center gap-3">
          <form method="POST" action="/admin/api/invoices/auto-overdue">
            <button
              type="submit"
              className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Run auto-overdue now
            </button>
          </form>

          <a
            href="/admin/api/invoices/auto-overdue"
            target="_blank"
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
            rel="noreferrer"
          >
            Dry run (open JSON)
          </a>
        </div>

        <div className="text-xs text-gray-500">
          Cron tip:
          <pre className="mt-2 rounded bg-gray-100 p-2 overflow-auto">
{`GET  https://www.rentback.app/admin/api/invoices/auto-overdue   # dry-run
POST https://www.rentback.app/admin/api/invoices/auto-overdue   # apply`}
          </pre>
        </div>
      </div>
    </div>
  );
}
