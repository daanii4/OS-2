import { Suspense } from 'react'
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--surface-page)]">
          <p className="os-body text-[var(--text-tertiary)]">Loading…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
