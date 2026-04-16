/**
 * GET /api/exports/caseload?month=YYYY-MM&school=&format=csv|json|pdf
 * Owner and assistant only. District monthly caseload export.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getTenantFromRequest } from '@/lib/tenant'
import { buildCaseloadCsv } from '@/lib/exports/caseload'

function parseMonth(raw: string | null): string | null {
  if (!raw || !/^\d{4}-\d{2}$/.test(raw)) return null
  return raw
}

export async function GET(req: Request) {
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

  if (profile.role === 'counselor') {
    return new NextResponse(null, { status: 403 })
  }

  if (profile.role !== 'owner' && profile.role !== 'assistant') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  const tenant = await getTenantFromRequest()
  if (profile.tenant_id && profile.tenant_id !== tenant.id) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const month = parseMonth(searchParams.get('month'))
  if (!month) {
    return NextResponse.json(
      { error: 'Query param month=YYYY-MM is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const school = searchParams.get('school')?.trim() || ''
  const format = (searchParams.get('format') ?? 'csv').toLowerCase()

  if (format === 'pdf') {
    return NextResponse.json(
      { error: 'PDF export is not available yet', code: 'NOT_IMPLEMENTED' },
      { status: 501 }
    )
  }

  const notes = await prisma.mentalHealthNote.findMany({
    where: {
      tenant_id: tenant.id,
      report_month: month,
      ...(school ? { school } : {}),
    },
    include: {
      student: {
        select: { first_name: true, last_name: true, grade: true },
      },
    },
    orderBy: [{ school: 'asc' }, { student: { last_name: 'asc' } }, { session_number: 'asc' }],
  })

  if (format === 'json') {
    return NextResponse.json({ data: notes, total: notes.length })
  }

  const csv = buildCaseloadCsv(notes, month)
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="caseload-${month}.csv"`,
    },
  })
}
