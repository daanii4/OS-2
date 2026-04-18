/**
 * GET /api/exports/caseload?month=YYYY-MM&school=...
 * Owner and assistant only. Returns PDF (district monthly caseload).
 */
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { format, parseISO } from 'date-fns'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { CaseloadDocument } from '@/lib/exports/CaseloadDocument'

const QuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'month must be YYYY-MM'),
  school: z.string().min(1, 'school is required'),
})

export async function GET(req: NextRequest) {
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
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  if (profile.role !== 'owner' && profile.role !== 'assistant') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  const tenant = await getTenantFromRequest()
  if (profile.tenant_id && profile.tenant_id !== tenant.id) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const parsed = QuerySchema.safeParse({
    month: searchParams.get('month'),
    school: searchParams.get('school'),
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid params', code: 'VALIDATION_ERROR', detail: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { month, school } = parsed.data

  const notes = await prisma.mentalHealthNote.findMany({
    where: {
      tenant_id: tenant.id,
      report_month: month,
      school,
    },
    include: {
      student: {
        select: {
          first_name: true,
          last_name: true,
          grade: true,
        },
      },
    },
    orderBy: [{ student: { last_name: 'asc' } }, { session_number: 'asc' }],
  })

  const totalStudents = new Set(notes.map(n => n.student_id)).size
  const totalSessions = notes.length
  const totalGroupSessions = notes.filter(n => n.session_format === 'group').length
  const totalIndivSessions = notes.filter(n => n.session_format === 'individual').length

  const displayMonth = format(parseISO(`${month}-01`), 'MMMM yyyy')

  const pdfDoc = (
    <CaseloadDocument
      month={displayMonth}
      school={school}
      tenantName={tenant.name}
      notes={notes}
      summary={{
        totalStudents,
        totalSessions,
        totalIndivSessions,
        totalGroupSessions,
      }}
    />
  )

  try {
    const buffer = await renderToBuffer(pdfDoc)

    const filename = `caseload-${school.replace(/\s+/g, '-').toLowerCase()}-${month}.pdf`

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.byteLength),
      },
    })
  } catch (err) {
    console.error('[exports/caseload] PDF render failed:', err)
    return NextResponse.json({ error: 'Server error', code: 'SERVER_ERROR' }, { status: 500 })
  }
}
