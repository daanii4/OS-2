'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ConfirmModal } from '@/components/ui/confirm-modal'

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
  viewerRole: 'owner' | 'assistant'
  viewerId: string
}

type ConfirmState =
  | null
  | { kind: 'remove'; profileId: string; name: string }
  | { kind: 'cancelInvite'; invitationId: string; name: string }

export function TeamRoster({
  initialProfiles,
  initialInvitations,
  viewerRole,
  viewerId,
}: Props) {
  const router = useRouter()
  const [profiles, setProfiles] = useState(initialProfiles)
  const [invitations, setInvitations] = useState(initialInvitations)
  const [loading, setLoading] = useState(false)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null)
  const [deletingInviteId, setDeletingInviteId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState>(null)

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

  function canRemoveProfile(p: ProfileRow): boolean {
    if (p.id === viewerId) return false
    if (viewerRole === 'assistant') return p.role === 'counselor'
    return true
  }

  async function executeRemoveProfile(profileId: string) {
    setDeletingProfileId(profileId)
    try {
      const res = await fetch(`/api/settings/team/${profileId}`, { method: 'DELETE' })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) {
        toast.error(json.error ?? 'Remove failed')
        return
      }
      toast.success('User removed')
      setConfirm(null)
      await refresh()
      router.refresh()
    } finally {
      setDeletingProfileId(null)
    }
  }

  async function executeCancelInvite(invitationId: string) {
    setDeletingInviteId(invitationId)
    try {
      const res = await fetch(`/api/settings/team/invitations/${invitationId}`, {
        method: 'DELETE',
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) {
        toast.error(json.error ?? 'Could not cancel invite')
        return
      }
      toast.success('Invitation canceled')
      setConfirm(null)
      await refresh()
      router.refresh()
    } finally {
      setDeletingInviteId(null)
    }
  }

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

  const confirmLoading =
    confirm?.kind === 'remove'
      ? deletingProfileId === confirm.profileId
      : confirm?.kind === 'cancelInvite'
        ? deletingInviteId === confirm.invitationId
        : false

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={confirm?.kind === 'remove'}
        title="Remove team member?"
        description={
          confirm?.kind === 'remove'
            ? `${confirm.name} will lose access and their account will be removed from this organization. This cannot be undone.`
            : ''
        }
        confirmLabel="Remove user"
        variant="danger"
        loading={confirmLoading}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm?.kind === 'remove') void executeRemoveProfile(confirm.profileId)
        }}
      />
      <ConfirmModal
        open={confirm?.kind === 'cancelInvite'}
        title="Cancel invitation?"
        description={
          confirm?.kind === 'cancelInvite'
            ? `The invite for ${confirm.name} will be canceled and the setup account removed. You can send a new invite later.`
            : ''
        }
        confirmLabel="Cancel invitation"
        variant="danger"
        loading={confirmLoading}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm?.kind === 'cancelInvite') void executeCancelInvite(confirm.invitationId)
        }}
      />

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
                  {canRemoveProfile(p) ? (
                    <button
                      type="button"
                      className="text-sm text-[var(--color-error)] underline-offset-2 hover:underline"
                      disabled={deletingProfileId === p.id}
                      onClick={() => setConfirm({ kind: 'remove', profileId: p.id, name: p.name })}
                    >
                      {deletingProfileId === p.id ? 'Removing…' : 'Remove'}
                    </button>
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
                <div className="flex flex-wrap items-center gap-2">
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
                  {viewerRole === 'owner' || (viewerRole === 'assistant' && inv.role === 'counselor') ? (
                    <button
                      type="button"
                      className="text-sm text-[var(--color-error)] underline-offset-2 hover:underline"
                      disabled={deletingInviteId === inv.id}
                      onClick={() =>
                        setConfirm({ kind: 'cancelInvite', invitationId: inv.id, name: inv.name })
                      }
                    >
                      {deletingInviteId === inv.id ? 'Canceling…' : 'Cancel invite'}
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
