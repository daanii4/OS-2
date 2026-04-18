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
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[var(--surface-page)]">
      <div className="mx-auto grid min-h-screen max-w-[1200px] grid-cols-1 lg:grid-cols-[420px_1fr]">
        <aside
          className="relative hidden flex-col justify-between overflow-hidden bg-[var(--olive-800)] text-white lg:flex"
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'var(--brand-glow)' }}
            aria-hidden
          />
          <div className="absolute left-0 top-0 h-full w-1 bg-[var(--gold-500)]" aria-hidden />

          <div className="relative z-10 p-10">
            <div className="mb-16 flex items-center gap-3">
              <img src="/logo-mark.png" alt="" className="h-10 w-10 object-contain" />
              <div>
                <p
                  className="text-[18px] text-white"
                  style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
                >
                  Operation Scholars
                </p>
                <p className="text-[10px] uppercase tracking-[0.08em] text-white/40">
                  Behavioral Intelligence Platform
                </p>
              </div>
            </div>

            <h1
              className="mb-5 text-[clamp(32px,3.5vw,48px)] font-normal leading-[1.05] tracking-[-0.025em] text-white"
              style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
            >
              Every student&apos;s
              <br />
              story,{' '}
              <em className="italic text-[var(--gold-500)]">clearly told.</em>
            </h1>

            <p className="max-w-[300px] text-[13px] leading-relaxed text-white/50">
              A safe environment to discover identity and character — and become lifelong learners.
            </p>
          </div>

          <div className="relative z-10 flex gap-0 p-10 pt-0">
            {[
              { n: '54%', label: 'Avg incident reduction' },
              { n: '88%', label: 'Session attendance' },
              { n: '47', label: 'Active students' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`flex-1 ${i > 0 ? 'ml-5 border-l border-white/10 pl-5' : ''}`}
              >
                <p
                  className="text-[28px] font-medium leading-none text-white"
                  style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace' }}
                >
                  {stat.n}
                </p>
                <p className="mt-1 text-[10px] leading-tight text-white/35">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="relative z-10 px-10 pb-8">
            <p className="text-[10px] text-white/20">FERPA-compliant · QuasarNova LLC · 2026</p>
          </div>
        </aside>

        <main className="flex items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full max-w-md space-y-4">
            <div className="os-card">
              <p className="os-label">Counselor access</p>
              <h1 className="os-title mt-2">Sign in to Scholars OS</h1>
              <p className="os-body mt-2 text-[var(--text-tertiary)]">
                Show up real. The students need you.
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
                  <strong>FERPA notice:</strong> This system contains protected student education
                  records. Unauthorized access is prohibited. All sessions are logged.
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
