'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type ProfileRow = {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  created_at: string
  onboarding_complete: boolean
}

type InvitationRow = {
  id: string
  email: string
  name: string
  role: string
  created_at: string
  resend_count: number
}

type Props = {
  initialProfiles: ProfileRow[]
  initialInvitations: InvitationRow[]
}

export function TeamRoster({ initialProfiles, initialInvitations }: Props) {
  const router = useRouter()
  const [profiles, setProfiles] = useState(initialProfiles)
  const [invitations, setInvitations] = useState(initialInvitations)
  const [loading, setLoading] = useState(false)
  const [resendingId, setResendingId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings/team')
      const json = (await res.json()) as {
        data?: { profiles: ProfileRow[]; invitations: InvitationRow[] }
      }
      if (!res.ok || !json.data) {
        toast.error('Could not refresh team list')
        return
      }
      setProfiles(json.data.profiles)
      setInvitations(json.data.invitations)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setProfiles(initialProfiles)
    setInvitations(initialInvitations)
  }, [initialProfiles, initialInvitations])

  async function resend(invitationId: string) {
    setResendingId(invitationId)
    try {
      const res = await fetch('/api/settings/team/invite/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) {
        toast.error(json.error ?? 'Resend failed')
        return
      }
      toast.success('New temporary password emailed')
      await refresh()
      router.refresh()
    } finally {
      setResendingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="os-card space-y-3">
        <h2 className="os-heading">Current team</h2>
        {loading ? (
          <p className="os-caption">Updating…</p>
        ) : profiles.length === 0 ? (
          <p className="os-body text-[var(--text-secondary)]">No team members yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--border-default)]">
            {profiles.map(p => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0">
                <div className="min-w-0">
                  <p className="os-body font-medium text-[var(--text-primary)]">{p.name}</p>
                  <p className="os-caption truncate">{p.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-[var(--surface-inner)] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                    {p.role}
                  </span>
                  {!p.active ? (
                    <span className="text-[11px] text-[var(--text-tertiary)]">Inactive</span>
                  ) : null}
                  {!p.onboarding_complete ? (
                    <span className="text-[11px] text-amber-700">Onboarding</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="os-card space-y-3">
        <h2 className="os-heading">Pending invites</h2>
        {invitations.length === 0 ? (
          <p className="os-body text-[var(--text-secondary)]">No pending invitations.</p>
        ) : (
          <ul className="divide-y divide-[var(--border-default)]">
            {invitations.map(inv => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0">
                <div className="min-w-0">
                  <p className="os-body font-medium text-[var(--text-primary)]">{inv.name}</p>
                  <p className="os-caption truncate">{inv.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-[var(--surface-inner)] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                    {inv.role}
                  </span>
                  <button
                    type="button"
                    className="os-btn-secondary text-sm"
                    disabled={resendingId === inv.id}
                    onClick={() => void resend(inv.id)}
                  >
                    {resendingId === inv.id ? 'Sending…' : 'Resend password email'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
