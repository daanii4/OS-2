import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { MeetingStatus } from '@prisma/client'
import { createClient } from '@/lib/supabase/server'
import { getMeetingDelegate } from '@/lib/meetings-db'
import { getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getTenantFromRequest } from '@/lib/tenant'

const MeetingTypeSchema = z.enum(['student_session', 'site_block', 'check_in', 'group'])

const PatchBodySchema = z
  .object({
    title: z.string().trim().min(1).max(300).optional(),
    meeting_date: z.string().datetime().optional(),
    duration_minutes: z.number().int().min(5).max(480).optional(),
    location: z.string().trim().max(300).optional().nullable(),
    meeting_type: MeetingTypeSchema.optional(),
    student_id: z.string().uuid().optional().nullable(),
    counselor_id: z.string().uuid().optional(),
    notes: z.string().trim().max(8000).optional().nullable(),
    status: z.nativeEnum(MeetingStatus).optional(),
  })
  .strip()

type RouteContext = {
  params: Promise<{ id: string }>
}

function canEditMeeting(role: string, profileId: string, meetingCounselorId: string): boolean {
  if (role === 'owner' || role === 'assistant') return true
  return profileId === meetingCounselorId
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { id: meetingId } = await ctx.params

  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  const profile = await getProfile(user.id)
  if (!profile || !profile.active) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  const tenant = await getTenantFromRequest()
  if (profile.tenant_id && profile.tenant_id !== tenant.id) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  const body = await req.json()
  const parsed = PatchBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid input',
        code: 'VALIDATION_ERROR',
        detail: parsed.error.flatten(),
      },
      { status: 400 }
    )
  }

  const d = getMeetingDelegate()
  if (!d) {
    return NextResponse.json(
      { error: 'Server error', code: 'SERVER_ERROR' },
      { status: 503 }
    )
  }

  const existing = await d.findFirst({
    where: { id: meetingId, tenant_id: tenant.id },
    select: {
      id: true,
      counselor_id: true,
    },
  })

  if (!existing) {
    return NextResponse.json(
      { error: 'Not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  if (!canEditMeeting(profile.role, profile.id, existing.counselor_id)) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  if (parsed.data.counselor_id !== undefined && (profile.role === 'owner' || profile.role === 'assistant')) {
    const nextCounselor = await prisma.profile.findFirst({
      where: {
        id: parsed.data.counselor_id,
        tenant_id: tenant.id,
        active: true,
      },
      select: { id: true },
    })
    if (!nextCounselor) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          code: 'VALIDATION_ERROR',
          detail: { counselor_id: ['Invalid counselor'] },
        },
        { status: 400 }
      )
    }
  } else if (parsed.data.counselor_id !== undefined && profile.role === 'counselor') {
    if (parsed.data.counselor_id !== profile.id) {
      return NextResponse.json(
        { error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }
  }

  if (parsed.data.student_id) {
    const student = await prisma.student.findFirst({
      where: { id: parsed.data.student_id, tenant_id: tenant.id },
      select: { id: true },
    })
    if (!student) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          code: 'VALIDATION_ERROR',
          detail: { student_id: ['Invalid student'] },
        },
        { status: 400 }
      )
    }
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json(
      {
        error: 'Invalid input',
        code: 'VALIDATION_ERROR',
        detail: { body: ['No fields to update'] },
      },
      { status: 400 }
    )
  }

  try {
    const data: {
      title?: string
      meeting_date?: Date
      duration_minutes?: number
      location?: string | null
      meeting_type?: string
      student_id?: string | null
      counselor_id?: string
      notes?: string | null
      status?: MeetingStatus
    } = {}

    if (parsed.data.title !== undefined) data.title = parsed.data.title
    if (parsed.data.meeting_date !== undefined) data.meeting_date = new Date(parsed.data.meeting_date)
    if (parsed.data.duration_minutes !== undefined) data.duration_minutes = parsed.data.duration_minutes
    if (parsed.data.location !== undefined) data.location = parsed.data.location
    if (parsed.data.meeting_type !== undefined) data.meeting_type = parsed.data.meeting_type
    if (parsed.data.student_id !== undefined) data.student_id = parsed.data.student_id
    if (parsed.data.counselor_id !== undefined) data.counselor_id = parsed.data.counselor_id
    if (parsed.data.notes !== undefined) data.notes = parsed.data.notes
    if (parsed.data.status !== undefined) data.status = parsed.data.status

    const updated = await d.update({
      where: { id: meetingId },
      data,
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
        updated_at: true,
      },
    })

    return NextResponse.json({ data: updated })
  } catch (e) {
    console.error('[meetings/id PATCH]', {
      meetingId,
      requesterId: profile.id,
      error: e instanceof Error ? e.message : 'Unknown',
    })
    return NextResponse.json(
      { error: 'Server error', code: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}

export async function DELETE(_: NextRequest, ctx: RouteContext) {
  const { id: meetingId } = await ctx.params

  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  const profile = await getProfile(user.id)
  if (!profile || !profile.active) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  const tenant = await getTenantFromRequest()
  if (profile.tenant_id && profile.tenant_id !== tenant.id) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  const d = getMeetingDelegate()
  if (!d) {
    return NextResponse.json(
      { error: 'Server error', code: 'SERVER_ERROR' },
      { status: 503 }
    )
  }

  const existing = await d.findFirst({
    where: { id: meetingId, tenant_id: tenant.id },
    select: {
      id: true,
      counselor_id: true,
    },
  })

  if (!existing) {
    return NextResponse.json(
      { error: 'Not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  if (!canEditMeeting(profile.role, profile.id, existing.counselor_id)) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  try {
    const updated = await d.update({
      where: { id: meetingId },
      data: { status: MeetingStatus.cancelled },
      select: {
        id: true,
        status: true,
        updated_at: true,
      },
    })

    return NextResponse.json({ data: updated })
  } catch (e) {
    console.error('[meetings/id DELETE]', {
      meetingId,
      requesterId: profile.id,
      error: e instanceof Error ? e.message : 'Unknown',
    })
    return NextResponse.json(
      { error: 'Server error', code: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}
