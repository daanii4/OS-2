import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Grade, SessionFormat, SessionType, StudentStatus } from '@prisma/client'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getTenantFromRequest } from '@/lib/tenant'

const StudentCreateSchema = z
  .object({
    first_name: z.string().trim().min(1),
    last_name: z.string().trim().min(1),
    date_of_birth: z.string().datetime().optional().nullable(),
    grade: z.nativeEnum(Grade),
    school: z.string().trim().min(1),
    district: z.string().trim().min(1),
    assigned_counselor_id: z.string().uuid().optional().nullable(),
    referral_source: z.string().trim().min(1),
    presenting_problem: z.string().trim().min(1),
    intake_date: z.string().datetime(),
    status: z.nativeEnum(StudentStatus).optional(),
    session_format: z.nativeEnum(SessionFormat).optional(),
    baseline_incident_count: z.number().int().nonnegative().optional().nullable(),
    baseline_window_start: z.string().datetime().optional().nullable(),
    baseline_window_end: z.string().datetime().optional().nullable(),
    general_notes: z.string().trim().optional().nullable(),
    school_year: z.string().regex(/^\d{4}-\d{4}$/).optional().nullable(),
    referral: z
      .object({
        referral_date: z.string().datetime().optional(),
        referred_by: z.string().trim().min(1),
        brief_description: z.string().trim().optional().nullable(),
        intervention_types: z.array(z.nativeEnum(SessionType)).min(1),
        assigned_to: z.string().uuid().optional().nullable(),
      })
      .optional(),
    consent: z
      .object({
        school_year: z.string().regex(/^\d{4}-\d{4}$/),
        parent_guardian_name: z.string().trim().min(1),
        consent_date: z.string().datetime(),
        district: z.string().trim().min(1),
        school: z.string().trim().min(1),
        behaviorist_name: z.string().trim().min(1),
        signed_copy_url: z.string().url().optional().nullable(),
      })
      .optional(),
  })
  .strip()

export async function GET() {
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

  const where =
    profile.role === 'counselor'
      ? { tenant_id: tenant.id, assigned_counselor_id: profile.id }
      : undefined

  const students = await prisma.student.findMany({
    where: where ?? { tenant_id: tenant.id },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      grade: true,
      school: true,
      district: true,
      school_year: true,
      status: true,
      session_format: true,
      assigned_counselor_id: true,
      baseline_incident_count: true,
      intake_date: true,
      created_at: true,
    },
  })

  return NextResponse.json({ data: students, total: students.length })
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

  if (profile.role === 'counselor') {
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
  const parsed = StudentCreateSchema.safeParse(body)
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

  if (parsed.data.assigned_counselor_id) {
    const assignedCounselor = await prisma.profile.findUnique({
      where: { id: parsed.data.assigned_counselor_id },
      select: { id: true, active: true, tenant_id: true },
    })

    if (
      !assignedCounselor ||
      !assignedCounselor.active ||
      assignedCounselor.tenant_id !== tenant.id
    ) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          code: 'VALIDATION_ERROR',
          detail: { assigned_counselor_id: ['Assigned counselor is invalid'] },
        },
        { status: 400 }
      )
    }
  }

  try {
    const result = await prisma.$transaction(async tx => {
      const student = await tx.student.create({
        data: {
          tenant_id: tenant.id,
          first_name: parsed.data.first_name,
          last_name: parsed.data.last_name,
          date_of_birth: parsed.data.date_of_birth
            ? new Date(parsed.data.date_of_birth)
            : null,
          grade: parsed.data.grade,
          school: parsed.data.school,
          district: parsed.data.district,
          assigned_counselor_id: parsed.data.assigned_counselor_id ?? null,
          referral_source: parsed.data.referral_source,
          presenting_problem: parsed.data.presenting_problem,
          intake_date: new Date(parsed.data.intake_date),
          status: parsed.data.status ?? StudentStatus.active,
          session_format: parsed.data.session_format ?? SessionFormat.individual,
          baseline_incident_count: parsed.data.baseline_incident_count ?? null,
          baseline_window_start: parsed.data.baseline_window_start
            ? new Date(parsed.data.baseline_window_start)
            : null,
          baseline_window_end: parsed.data.baseline_window_end
            ? new Date(parsed.data.baseline_window_end)
            : null,
          general_notes: parsed.data.general_notes ?? null,
          school_year: parsed.data.school_year ?? null,
        },
      })

      const referral = await tx.referral.create({
        data: {
          tenant_id: tenant.id,
          student_id: student.id,
          referral_date: parsed.data.referral?.referral_date
            ? new Date(parsed.data.referral.referral_date)
            : new Date(parsed.data.intake_date),
          referred_by: parsed.data.referral?.referred_by ?? parsed.data.referral_source,
          brief_description:
            parsed.data.referral?.brief_description ?? parsed.data.presenting_problem,
          intervention_types: parsed.data.referral?.intervention_types ?? [SessionType.check_in],
          assigned_to: parsed.data.referral?.assigned_to ?? parsed.data.assigned_counselor_id ?? null,
          created_by: profile.id,
        },
      })

      const consent = parsed.data.consent
        ? await tx.consentRecord.create({
            data: {
              tenant_id: tenant.id,
              student_id: student.id,
              school_year: parsed.data.consent.school_year,
              parent_guardian_name: parsed.data.consent.parent_guardian_name,
              consent_date: new Date(parsed.data.consent.consent_date),
              district: parsed.data.consent.district,
              school: parsed.data.consent.school,
              behaviorist_name: parsed.data.consent.behaviorist_name,
              signed_copy_url: parsed.data.consent.signed_copy_url ?? null,
              created_by: profile.id,
            },
          })
        : null

      if (consent) {
        await tx.referral.update({
          where: { id: referral.id },
          data: { linked_consent_id: consent.id },
        })
      }

      return { student, referral, consent }
    })

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (createError) {
    console.error('[students/POST] Failed to create student', {
      requesterId: profile.id,
      role: profile.role,
      error: createError instanceof Error ? createError.message : 'Unknown',
    })
    return NextResponse.json(
      { error: 'Server error', code: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}
