import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { MeetingStatus } from '@prisma/client'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { getMeetingDelegate } from '@/lib/meetings-db'
import { prisma } from '@/lib/prisma'
import { getTenantFromRequest } from '@/lib/tenant'

const MeetingTypeSchema = z.enum(['student_session', 'site_block', 'check_in', 'group'])

const PostBodySchema = z
  .object({
    title: z.string().trim().min(1).max(300),
    meeting_date: z.string().datetime(),
    duration_minutes: z.number().int().min(5).max(480).optional(),
    location: z.string().trim().max(300).optional().nullable(),
    meeting_type: MeetingTypeSchema,
    student_id: z.string().uuid().optional().nullable(),
    counselor_id: z.string().uuid().optional(),
    notes: z.string().trim().max(8000).optional().nullable(),
    status: z.nativeEnum(MeetingStatus).optional(),
  })
  .strip()

export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url)
  const daysParam = searchParams.get('days')
  const days = daysParam ? Math.min(90, Math.max(1, Number(daysParam))) : 7
  const fromParam = searchParams.get('from')
  const now = fromParam ? new Date(fromParam) : new Date()
  const end = new Date(now)
  end.setDate(end.getDate() + days)
  end.setHours(23, 59, 59, 999)

  const counselorOnly = profile.role === 'counselor'

  const d = getMeetingDelegate()
  if (!d) {
    return NextResponse.json(
      { error: 'Server error', code: 'SERVER_ERROR' },
      { status: 503 }
    )
  }

  const meetings = await d.findMany({
    where: {
      tenant_id: tenant.id,
      ...(counselorOnly ? { counselor_id: profile.id } : {}),
      meeting_date: {
        gte: now,
        lte: end,
      },
      status: { in: [MeetingStatus.scheduled, MeetingStatus.rescheduled] },
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
      student_id: true,
      counselor_id: true,
      counselor: { select: { id: true, name: true } },
      student: {
        select: { id: true, first_name: true, last_name: true },
      },
    },
  })

  return NextResponse.json({ data: meetings, total: meetings.length })
}

export async function POST(req: NextRequest) {
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
  const parsed = PostBodySchema.safeParse(body)
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

  let counselorId: string
  if (profile.role === 'counselor') {
    counselorId = profile.id
    if (parsed.data.counselor_id && parsed.data.counselor_id !== profile.id) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          code: 'VALIDATION_ERROR',
          detail: { counselor_id: ['Counselors can only schedule for themselves'] },
        },
        { status: 400 }
      )
    }
  } else {
    if (!parsed.data.counselor_id) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          code: 'VALIDATION_ERROR',
          detail: { counselor_id: ['Required'] },
        },
        { status: 400 }
      )
    }
    counselorId = parsed.data.counselor_id
  }

  const counselor = await prisma.profile.findFirst({
    where: {
      id: counselorId,
      tenant_id: tenant.id,
      active: true,
    },
    select: { id: true },
  })

  if (!counselor) {
    return NextResponse.json(
      {
        error: 'Invalid input',
        code: 'VALIDATION_ERROR',
        detail: { counselor_id: ['Invalid counselor'] },
      },
      { status: 400 }
    )
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

  const delegate = getMeetingDelegate()
  if (!delegate) {
    return NextResponse.json(
      { error: 'Server error', code: 'SERVER_ERROR' },
      { status: 503 }
    )
  }

  try {
    const meeting = await delegate.create({
      data: {
        tenant_id: tenant.id,
        student_id: parsed.data.student_id ?? null,
        counselor_id: counselorId,
        title: parsed.data.title,
        meeting_date: new Date(parsed.data.meeting_date),
        duration_minutes: parsed.data.duration_minutes ?? 30,
        location: parsed.data.location ?? null,
        meeting_type: parsed.data.meeting_type,
        status: parsed.data.status ?? MeetingStatus.scheduled,
        notes: parsed.data.notes ?? null,
        created_by: profile.id,
      },
      select: {
        id: true,
        title: true,
        meeting_date: true,
        duration_minutes: true,
        location: true,
        meeting_type: true,
        status: true,
        student_id: true,
        counselor_id: true,
        created_at: true,
      },
    })

    return NextResponse.json({ data: meeting }, { status: 201 })
  } catch (e) {
    console.error('[meetings/POST]', {
      requesterId: profile.id,
      error: e instanceof Error ? e.message : 'Unknown',
    })
    return NextResponse.json(
      { error: 'Server error', code: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}
