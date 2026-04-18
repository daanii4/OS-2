'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogoAnimation } from '@/components/LogoAnimation'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const reducedMotion = usePrefersReducedMotion()

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error('Failed to update password — please try again')
      setLoading(false)
      return
    }

    const res = await fetch('/api/auth/complete-reset', { method: 'POST' })
    if (!res.ok) {
      toast.error('Could not finalize reset — please try again')
      setLoading(false)
      return
    }

    toast.success('Password set — welcome to Operation Scholars OS')
    setTimeout(() => router.push('/onboarding'), 800)
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[var(--surface-page)] px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          {reducedMotion ? (
            <img src="/logo.png" width={100} height={100} alt="Operation Scholars" />
          ) : (
            <LogoAnimation size={100} loop={false} />
          )}
        </div>

        <h1 className="os-title text-center">Set your password</h1>
        <p className="os-body mt-2 text-center text-[var(--text-secondary)]">
          Choose a secure password to access Operation Scholars OS.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleReset}>
          <div>
            <label className="os-label mb-1 block" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              className="os-input w-full"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="os-label mb-1 block" htmlFor="confirm">
              Confirm password
            </label>
            <input
              id="confirm"
              className="os-input w-full"
              type="password"
              placeholder="Repeat your password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="os-btn-primary w-full" disabled={loading}>
            {loading ? 'Setting password...' : 'Set password and continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
