import { prisma } from '@/lib/prisma'
import { TeamRoster } from '@/components/settings/team-roster'
import {
  teamRosterEmailExclude,
  teamRosterInvitationEmailExclude,
} from '@/lib/team-roster-filter'

type Props = {
  tenantId: string
  viewerId: string
  viewerRole: 'owner' | 'assistant'
}

export async function TeamRosterData({ tenantId, viewerId, viewerRole }: Props) {
  const profileExtra = teamRosterEmailExclude()
  const inviteExtra = teamRosterInvitationEmailExclude()

  const [profiles, invitations] = await Promise.all([
    prisma.profile.findMany({
      where: { tenant_id: tenantId, ...profileExtra },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        created_at: true,
        onboarding_complete: true,
      },
      orderBy: { created_at: 'asc' },
    }),
    prisma.invitation.findMany({
      where: { tenant_id: tenantId, status: 'pending', ...inviteExtra },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        created_at: true,
        resend_count: true,
      },
      orderBy: { created_at: 'desc' },
    }),
  ])

  return (
    <TeamRoster
      viewerId={viewerId}
      viewerRole={viewerRole}
      initialProfiles={profiles.map(p => ({
        ...p,
        created_at: p.created_at.toISOString(),
      }))}
      initialInvitations={invitations.map(i => ({
        ...i,
        created_at: i.created_at.toISOString(),
      }))}
    />
  )
}

export function TeamRosterSkeleton() {
  return (
    <div className="os-card space-y-3" aria-hidden>
      <div className="h-5 w-32 animate-pulse rounded bg-[var(--surface-inner)]" />
      <div className="space-y-2">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="flex items-center justify-between rounded-md border border-[var(--border-default)] p-3"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-[var(--surface-inner)]" />
              <div className="space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-[var(--surface-inner)]" />
                <div className="h-3 w-28 animate-pulse rounded bg-[var(--surface-inner)]" />
              </div>
            </div>
            <div className="h-4 w-16 animate-pulse rounded bg-[var(--surface-inner)]" />
          </div>
        ))}
      </div>
    </div>
  )
}
