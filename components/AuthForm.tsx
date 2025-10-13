// components/AuthForm.tsx
'use client'

import { useState } from 'react'
import { supabaseClient } from '@/lib/supabase/client'

export default function AuthForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)

    // After login, land on /auth/callback?code=... then redirect to /tenant
    const callback = `${window.location.origin}/auth/callback?next=${encodeURIComponent('/tenant')}`

    const { error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callback },
    })

    if (error) setErr(error.message)
    else setSent(true)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-md border p-3"
      />
      <button className="px-5 py-3 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
        Send magic link
      </button>
      {sent && <p>Check your email for the sign-in link.</p>}
      {err && <p className="text-red-600">{err}</p>}
    </form>
  )
}
