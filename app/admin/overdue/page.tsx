// app/admin/overdue/page.tsx
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminOverduePage() {
  // Middleware + route guards already protect /admin; keep page simple.
  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Overdue Runner</h1>
        <Link href="/admin/payments" className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50">
          ← Admin Payments
        </Link>
      </div>

      <p className="mb-4 text-sm text-gray-600">
        This will mark all OPEN invoices past their due date as OVERDUE. Use sparingly.
      </p>

      <form action="/admin/api/invoices/overdue/run" method="post">
        <button
          type="submit"
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Run now
        </button>
      </form>

      <div className="mt-6 text-xs text-gray-500">
        For a count only, you can call <code>/admin/api/invoices/overdue/dry-run</code>.
      </div>
    </div>
  );
}
