import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MeetingStatus } from '@prisma/client'
import { createClient } from '@/lib/supabase/server'
import { safeMeetingFindMany } from '@/lib/meetings-db'
import { getProfile } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'

export default async function SchedulePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await getProfile(user.id)
  if (!profile || !profile.active) redirect('/login')

  const tenant = await getTenantFromRequest()
  if (profile.tenant_id && profile.tenant_id !== tenant.id) {
    redirect('/login')
  }

  const isOrgView = profile.role === 'owner' || profile.role === 'assistant'

  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 90)

  const meetings = await safeMeetingFindMany({
    where: {
      tenant_id: tenant.id,
      ...(isOrgView ? {} : { counselor_id: profile.id }),
      meeting_date: { gte: start, lte: end },
      status: { not: MeetingStatus.cancelled },
    },
    orderBy: { meeting_date: 'asc' },
    select: {
      id: true,
      title: true,
      meeting_date: true,
      duration_minutes: true,
      location: true,
      meeting_type: true,
      status: true,
      counselor: { select: { name: true } },
      student: { select: { first_name: true, last_name: true } },
    },
  })

  return (
    <div className="os-page">
      <div className="os-card-tight mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="os-title">Schedule</h1>
        <Link href="/dashboard" className="os-btn-secondary">
          Back to dashboard
        </Link>
      </div>

      <div className="os-card">
        <h2 className="os-heading mb-3">Upcoming (90 days)</h2>
        {meetings.length === 0 ? (
          <p className="os-body">No meetings scheduled.</p>
        ) : (
          <ul className="space-y-2">
            {meetings.map(m => (
              <li key={m.id} className="rounded-md bg-[var(--surface-inner)] p-3">
                <Link href={`/dashboard/schedule/${m.id}`} className="os-heading underline">
                  {m.title}
                </Link>
                <p className="os-caption mt-1">
                  {new Date(m.meeting_date).toLocaleString()} · {m.duration_minutes} min ·{' '}
                  <span className="capitalize">{m.meeting_type.replace(/_/g, ' ')}</span>
                    {m.location ? ` · ${m.location}` : ''}
                  {isOrgView && ` · ${m.counselor.name}`}
                  {m.student &&
                    ` · ${m.student.first_name} ${m.student.last_name}`}
                </p>
                <span className="mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--olive-800)] bg-[var(--olive-100)]">
                  {m.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
