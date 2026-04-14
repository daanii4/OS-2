import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { safeMeetingFindFirst } from '@/lib/meetings-db'
import { getProfile } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import { MeetingDetailForm } from '../meeting-detail-form'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function MeetingDetailPage({ params }: PageProps) {
  const { id: meetingId } = await params

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

  const meeting = await safeMeetingFindFirst({
    where: {
      id: meetingId,
      tenant_id: tenant.id,
      ...(profile.role === 'counselor' ? { counselor_id: profile.id } : {}),
    },
    select: {
      id: true,
      title: true,
      meeting_date: true,
      duration_minutes: true,
      location: true,
      meeting_type: true,
      status: true,
      notes: true,
      student_id: true,
      counselor_id: true,
      counselor: { select: { name: true } },
      student: { select: { first_name: true, last_name: true } },
    },
  })

  if (!meeting) notFound()

  const canEdit =
    isOrgView || meeting.counselor_id === profile.id

  return (
    <div className="os-page">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/schedule"
            className="os-label text-[var(--text-quaternary)] hover:text-[var(--text-secondary)]"
          >
            Schedule
          </Link>
          <span className="os-label text-[var(--text-quaternary)]">/</span>
          <span className="os-label text-[var(--text-secondary)]">
            {meeting.title}
          </span>
        </div>
        <Link href="/dashboard" className="os-btn-secondary">
          Dashboard
        </Link>
      </div>

      <div className="os-card mb-4">
        <h1 className="os-title mb-2">{meeting.title}</h1>
        <p className="os-body">
          {new Date(meeting.meeting_date).toLocaleString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
        <p className="os-caption mt-2 capitalize">
          {meeting.meeting_type.replace(/_/g, ' ')} · {meeting.duration_minutes} minutes
        </p>
        {meeting.location && <p className="os-body mt-1">{meeting.location}</p>}
        {isOrgView && (
          <p className="os-caption mt-2">Counselor: {meeting.counselor.name}</p>
        )}
        {meeting.student && (
          <p className="os-body mt-2">
            Student: {meeting.student.first_name} {meeting.student.last_name}
          </p>
        )}
      </div>

      <MeetingDetailForm
        meetingId={meeting.id}
        initialStatus={meeting.status}
        initialNotes={meeting.notes}
        canEdit={canEdit}
        studentId={meeting.student_id}
      />
    </div>
  )
}
