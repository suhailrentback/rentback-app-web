// app/tenant/page.tsx
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TenantPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Tenant dashboard</h1>
        <p className="mt-2 text-gray-600">Please sign in to continue.</p>
        <Link
          href="/sign-in"
          className="mt-6 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700/90">Tenant</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-600">{user.email}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/tenant/invoices"
          className="rounded-2xl border bg-white p-5 shadow-sm transition hover:bg-gray-50"
        >
          <div className="text-sm font-semibold text-gray-900">Invoices</div>
          <p className="mt-1 text-sm text-gray-600">
            See issued, paid, and overdue invoices with amounts and due dates.
          </p>
          <span className="mt-3 inline-flex rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">
            View invoices
          </span>
        </Link>

        <Link
          href="/tenant/rewards"
          className="rounded-2xl border bg-white p-5 shadow-sm transition hover:bg-gray-50"
        >
          <div className="text-sm font-semibold text-gray-900">Rewards</div>
          <p className="mt-1 text-sm text-gray-600">Track your points and available redemptions.</p>
          <span className="mt-3 inline-flex rounded-lg border px-3 py-1.5 text-xs font-semibold">
            View rewards
          </span>
        </Link>

        <div className="rounded-2xl border bg-white p-5 opacity-75 shadow-sm">
          <div className="text-sm font-semibold text-gray-900">Payments</div>
          <p className="mt-1 text-sm text-gray-600">Pay securely (coming soon).</p>
          <span className="mt-3 inline-flex rounded-lg border px-3 py-1.5 text-xs font-semibold">
            Coming soon
          </span>
        </div>
      </div>

      {/* Placeholder for recent activity (safe to keep or remove) */}
      <div className="mt-10 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Recent activity</h2>
          <span className="text-xs text-gray-500">Auto-updates as you pay invoices</span>
        </div>
        <div className="mt-4 text-sm text-gray-600">No recent activity yet.</div>
      </div>
    </div>
  );
}
