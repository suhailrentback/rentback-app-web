'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AuthForm() {
  const supabase = createClientComponentClient()
  const search = useSearchParams()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const nextParam = search.get('next') || '/tenant'

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setSent(false)

    // IMPORTANT: Land the email link on /auth/callback with the "next" you want
    const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      nextParam
    )}`

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    })

    if (error) {
      setErr(error.message)
      return
    }
    setSent(true)
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 max-w-md">
      <label className="grid gap-2">
        <span className="text-sm font-medium">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="rounded-lg border px-3 py-2"
          placeholder="you@example.com"
        />
      </label>

      <button
        type="submit"
        className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 font-semibold"
        disabled={sent}
      >
        {sent ? 'Check your email…' : 'Send magic link'}
      </button>

      {err && <p className="text-sm text-red-600">{err}</p>}
      {!err && sent && (
        <p className="text-sm">Magic link sent. Open it on this device.</p>
      )}
    </form>
  )
}
