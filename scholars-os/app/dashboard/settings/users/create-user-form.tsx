'use client'

import { useState } from 'react'

export function CreateUserForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'counselor' | 'assistant'>('counselor')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const res = await fetch('/api/org/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    })

    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(json.error ?? 'Failed to create user')
      return
    }

    setSuccess(`${json.data?.name ?? 'User'} created successfully`)
    setName('')
    setEmail('')
    setPassword('')
    setRole('counselor')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-[var(--color-regression)]/10 px-4 py-3 os-body text-[var(--color-regression)]">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-[var(--color-success)]/10 px-4 py-3 os-body text-[var(--color-success)]">
          {success}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="os-label mb-1 block">Full name</label>
          <input
            className="os-input w-full"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Jordan Smith"
            required
          />
        </div>
        <div>
          <label className="os-label mb-1 block">Email</label>
          <input
            className="os-input w-full"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="jordan@operationscholars.org"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="os-label mb-1 block">Temporary password</label>
          <input
            className="os-input w-full"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            required
            minLength={8}
          />
        </div>
        <div>
          <label className="os-label mb-1 block">Role</label>
          <select
            className="os-input w-full"
            value={role}
            onChange={e => setRole(e.target.value as 'counselor' | 'assistant')}
          >
            <option value="counselor">Counselor</option>
            <option value="assistant">Assistant</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="os-btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create account'}
        </button>
      </div>
    </form>
  )
}
