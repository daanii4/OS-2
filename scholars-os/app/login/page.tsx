'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [keepSignedIn, setKeepSignedIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Generic message — do not surface Supabase error details to UI
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[var(--surface-page)]">
      <div className="mx-auto grid min-h-screen max-w-[1200px] grid-cols-1 lg:grid-cols-[240px_1fr]">
        <aside className="hidden bg-[var(--olive-800)] text-white lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="relative h-8 w-8 overflow-hidden rounded-md bg-white/10">
                <img
                  src="/IMG_0219.PNG"
                  alt="Operation Scholars logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="os-heading text-white">Scholars OS</p>
                <p className="os-caption text-white/60">
                  Behavioral intelligence platform
                </p>
              </div>
            </div>
          </div>
          <div className="flex-1 px-5 py-6">
            <p className="os-label text-[var(--gold-500)]">209 area · central valley, ca</p>
            <h2 className="mt-5 text-5xl leading-[1.05] tracking-[-0.02em] font-[var(--font-serif)] text-white">
              Every student&apos;s
              <br />
              story, <span className="italic text-[var(--gold-500)]">clearly told.</span>
            </h2>
            <p className="os-body mt-6 text-white/70">
              Evidence-based behavioral tracking for counseling contractors serving
              middle and high school students across the Central Valley.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
              <div>
                <p className="os-data-lg text-white">54%</p>
                <p className="os-caption text-white/60">Avg incident reduction</p>
              </div>
              <div>
                <p className="os-data-lg text-white">88%</p>
                <p className="os-caption text-white/60">Session attendance rate</p>
              </div>
              <div>
                <p className="os-data-lg text-white">47</p>
                <p className="os-caption text-white/60">Active students</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 px-5 py-4">
            <p className="os-caption text-white/50">
              Secured by FERPA-compliant infrastructure · QuasarNova LLC · 2026
            </p>
          </div>
        </aside>

        <main className="flex items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full max-w-md space-y-4">
            <div className="os-card">
              <p className="os-label">Counselor access</p>
              <h1 className="os-title mt-2">Sign in to Scholars OS</h1>
              <p className="os-body mt-2">
                Access is restricted to authorized Operation Scholars staff.
              </p>

              <form onSubmit={handleLogin} className="mt-5 grid gap-3">
                <div className="grid gap-1">
                  <label className="os-label" htmlFor="email">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@opscholars.org"
                    required
                    className="os-input"
                    autoComplete="email"
                  />
                </div>

                <div className="grid gap-1">
                  <div className="flex flex-wrap items-center justify-between gap-y-1">
                    <label className="os-label" htmlFor="password">
                      Password
                    </label>
                    <button
                      type="button"
                      className="os-caption text-[var(--olive-600)] underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="os-input"
                    autoComplete="current-password"
                  />
                </div>

                <label className="os-body mt-1 inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={e => setKeepSignedIn(e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--border-default)]"
                  />
                  Keep me signed in for 30 days
                </label>

                {error && (
                  <p className="os-caption text-[var(--color-error)]" role="alert">
                    {error}
                  </p>
                )}

                <button type="submit" disabled={loading} className="os-btn-primary mt-1">
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-[var(--border-default)]" />
                <span className="os-caption">Protected access</span>
                <div className="h-px flex-1 bg-[var(--border-default)]" />
              </div>

              <div className="rounded-lg border border-[var(--olive-200)] bg-[var(--olive-50)] p-3">
                <p className="os-body">
                  <strong>FERPA notice:</strong> This system contains protected
                  student education records. Unauthorized access is prohibited. All
                  sessions are logged.
                </p>
              </div>

              <p className="os-body mt-4 text-center">
                Need access? Contact De&apos;marieya Nelson
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
