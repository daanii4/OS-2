/**
 * GET /api/students/[id]/export?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Per-student session history PDF. Access via canAccessStudent.
 */
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { endOfDay, parseISO, startOfDay } from 'date-fns'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { canAccessStudent, getProfile } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { StudentHistoryDocument } from '@/lib/exports/StudentHistoryDocument'

const QuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { id: studentId } = await ctx.params

  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const profile = await getProfile(user.id)
  if (!profile || !profile.active) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  const tenant = await getTenantFromRequest()
  if (profile.tenant_id && profile.tenant_id !== tenant.id) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  const authorized = await canAccessStudent(profile.id, profile.role, studentId, tenant.id)
  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const parsed = QuerySchema.safeParse({
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid params', code: 'VALIDATION_ERROR', detail: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { from, to } = parsed.data

  const student = await prisma.student.findFirst({
    where: { id: studentId, tenant_id: tenant.id },
    select: {
      first_name: true,
      last_name: true,
      grade: true,
      school: true,
      district: true,
      intake_date: true,
    },
  })

  if (!student) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 })
  }

  const dateFilter =
    from || to
      ? {
          session_date: {
            ...(from ? { gte: startOfDay(parseISO(from)) } : {}),
            ...(to ? { lte: endOfDay(parseISO(to)) } : {}),
          },
        }
      : {}

  const sessions = await prisma.session.findMany({
    where: {
      student_id: studentId,
      tenant_id: tenant.id,
      attendance_status: 'attended',
      ...dateFilter,
    },
    orderBy: { session_date: 'asc' },
    select: {
      session_date: true,
      session_type: true,
      session_format: true,
      duration_minutes: true,
      goals_met: true,
      goals_attempted: true,
      goal_completion_rate: true,
      session_summary: true,
    },
  })

  const incidentWhere: {
    student_id: string
    tenant_id: string
    incident_date?: { gte?: Date; lte?: Date }
  } = {
    student_id: studentId,
    tenant_id: tenant.id,
  }
  if (from || to) {
    incidentWhere.incident_date = {
      ...(from ? { gte: startOfDay(parseISO(from)) } : {}),
      ...(to ? { lte: endOfDay(parseISO(to)) } : {}),
    }
  }

  const incidentCount = await prisma.behavioralIncident.count({
    where: incidentWhere,
  })

  const pdfDoc = (
    <StudentHistoryDocument
      student={student}
      sessions={sessions}
      incidentCount={incidentCount}
      dateRange={{ from: from ?? null, to: to ?? null }}
      tenantName={tenant.name}
    />
  )

  try {
    const buffer = await renderToBuffer(pdfDoc)

    const filename = `${student.last_name}-${student.first_name}-history.pdf`
      .replace(/\s+/g, '-')
      .toLowerCase()

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.byteLength),
      },
    })
  } catch (err) {
    console.error('[students/export] PDF render failed:', err)
    return NextResponse.json({ error: 'Server error', code: 'SERVER_ERROR' }, { status: 500 })
  }
}
