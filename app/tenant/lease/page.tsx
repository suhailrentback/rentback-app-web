// WEB /app/tenant/lease/page.tsx
import { createServerSupabase } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function MyLeasePage() {
  const supabase = createServerSupabase()
  const { data: userRes } = await supabase.auth.getUser()
  if (!userRes?.user) {
    return (
      <div className="max-w-2xl mx-auto py-16">
        <p className="text-lg">Please <Link className="underline" href="/sign-in?next=/tenant/lease">sign in</Link>.</p>
      </div>
    )
  }

  const { data: lease } = await supabase
    .from('lease')
    .select(`
      id, start_date, end_date, rent_amount, status,
      unit:unit_id (
        unit_number,
               property:property_id ( name )
      )
    `)
    .eq('tenant_id', userRes.user.id)
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <section className="max-w-3xl mx-auto py-16 space-y-6">
      <h1 className="text-2xl font-bold">My Lease</h1>
      {!lease ? (
        <p>No active lease found.</p>
      ) : (
        <div className="rounded-xl border p-4">
          <div className="font-semibold">{lease.unit?.property?.name} — Unit {lease.unit?.unit_number}</div>
          <div className="text-sm opacity-80">
            {lease.start_date} → {lease.end_date ?? '—'}
          </div>
          <div className="mt-2">Rent: <span className="font-medium">Rs {Number(lease.rent_amount).toLocaleString()}</span></div>
          <div className="text-sm mt-1">Status: {lease.status}</div>
        </div>
      )}
      <div><Link className="underline" href="/tenant/payments">View my payments →</Link></div>
    </section>
  )
}
