// WEB /app/tenant/payments/page.tsx
import { createServerSupabase } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function MyPaymentsPage() {
  const supabase = createServerSupabase()
  const { data: userRes } = await supabase.auth.getUser()
  if (!userRes?.user) {
    return (
      <div className="max-w-2xl mx-auto py-16">
        <p className="text-lg">Please <Link className="underline" href="/sign-in?next=/tenant/payments">sign in</Link>.</p>
      </div>
    )
  }

  const { data: payments } = await supabase
    .from('payment')
    .select('id, amount, status, paid_at, created_at')
    .eq('tenant_id', userRes.user.id)
    .order('created_at', { ascending: false })

  return (
    <section className="max-w-3xl mx-auto py-16 space-y-6">
      <h1 className="text-2xl font-bold">My Payments</h1>
      {!payments?.length ? (
        <p>No payments yet.</p>
      ) : (
        <ul className="space-y-2">
          {payments.map((p:any) => (
            <li key={p.id} className="rounded-xl border p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">Rs {Number(p.amount).toLocaleString()}</div>
                <div className="text-sm opacity-80">{new Date(p.created_at).toLocaleString()}</div>
              </div>
              <div className="text-sm">{p.status}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
