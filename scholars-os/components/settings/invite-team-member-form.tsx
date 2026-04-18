'use client'

import { useState } from 'react'
import { toast } from 'sonner'

export function InviteTeamMemberForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'counselor' | 'assistant'>('counselor')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/settings/team/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, role }),
    })

    const json = (await res.json()) as { error?: string }
    setLoading(false)

    if (!res.ok) {
      toast.error(json.error ?? 'Invite failed')
      return
    }

    toast.success('Invitation sent')
    setName('')
    setEmail('')
    setRole('counselor')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="os-label mb-1 block">Full name</label>
          <input
            className="os-input w-full"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            minLength={2}
          />
        </div>
        <div>
          <label className="os-label mb-1 block">Email</label>
          <input
            className="os-input w-full"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
      </div>
      <div>
        <label className="os-label mb-1 block">Role</label>
        <select
          className="os-input w-full max-w-xs"
          value={role}
          onChange={e => setRole(e.target.value as 'counselor' | 'assistant')}
        >
          <option value="counselor">Counselor</option>
          <option value="assistant">Assistant</option>
        </select>
      </div>
      <button type="submit" className="os-btn-primary" disabled={loading}>
        {loading ? 'Sending…' : 'Send invite'}
      </button>
    </form>
  )
}
