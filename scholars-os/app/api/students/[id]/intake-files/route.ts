import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { put } from '@vercel/blob'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { canAccessStudent, getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getTenantFromRequest } from '@/lib/tenant'
import { parseIntakeFiles, type IntakeFileEntry } from '@/lib/types/intake-file'

const MAX_BYTES = 10 * 1024 * 1024

/** PDF and Word documents only (aligned with prior referral packet uploads). */
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const DeleteBodySchema = z.object({
  url: z.string().url(),
})

type RouteContext = {
  params: Promise<{ id: string }>
}

function extensionFromName(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i).toLowerCase() : ''
}

const ALLOWED_EXT = new Set(['.pdf', '.doc', '.docx'])

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { id: studentId } = await ctx.params

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

  const authorized = await canAccessStudent(profile.id, profile.role, studentId, tenant.id)
  if (!authorized) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, tenant_id: tenant.id },
    select: { id: true, intake_files: true },
  })

  if (!student) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('[intake-files/POST] BLOB_READ_WRITE_TOKEN is not configured')
    return NextResponse.json(
      { error: 'Server error', code: 'SERVER_ERROR' },
      { status: 500 }
    )
  }

  const formData = await req.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION_ERROR', detail: { file: ['Expected file'] } },
      { status: 400 }
    )
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error: 'Invalid input',
        code: 'VALIDATION_ERROR',
        detail: { file: ['File must be 10MB or smaller'] },
      },
      { status: 400 }
    )
  }

  const mime = file.type || 'application/octet-stream'
  const ext = extensionFromName(file.name)
  if (!ALLOWED_MIME.has(mime) && !ALLOWED_EXT.has(ext)) {
    return NextResponse.json(
      {
        error: 'Invalid input',
        code: 'VALIDATION_ERROR',
        detail: { file: ['Use PDF or Word only (.pdf, .doc, .docx)'] },
      },
      { status: 400 }
    )
  }

  const referredByRaw = formData.get('referred_by')
  const briefRaw = formData.get('brief_description')
  const referralDateRaw = formData.get('referral_date')
  const referred_by =
    typeof referredByRaw === 'string' && referredByRaw.trim()
      ? referredByRaw.trim().slice(0, 500)
      : null
  const brief_description =
    typeof briefRaw === 'string' && briefRaw.trim()
      ? briefRaw.trim().slice(0, 8000)
      : null
  let referral_date: string | null = null
  if (typeof referralDateRaw === 'string' && referralDateRaw.trim()) {
    const d = new Date(`${referralDateRaw.trim()}T12:00:00.000Z`)
    if (!Number.isNaN(d.getTime())) {
      referral_date = d.toISOString()
    }
  }

  const safeName = file.name.replace(/[^\w.\- ()]+/g, '_').slice(0, 180)
  const pathname = `tenants/${tenant.id}/students/${studentId}/${crypto.randomUUID()}-${safeName}`

  try {
    const blob = await put(pathname, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    const existing = parseIntakeFiles(student.intake_files)
    const uploaded_at = new Date().toISOString()
    const entry: IntakeFileEntry = {
      name: file.name,
      url: blob.url,
      uploaded_at,
      ...(referred_by ? { referred_by } : {}),
      ...(brief_description ? { brief_description } : {}),
      ...(referral_date ? { referral_date } : {}),
    }
    const next = [...existing, entry]

    await prisma.student.update({
      where: { id: studentId },
      data: { intake_files: next },
    })

    return NextResponse.json({ data: { entry } }, { status: 201 })
  } catch (uploadError) {
    console.error('[intake-files/POST] Blob upload failed', {
      studentId,
      requesterId: profile.id,
      error: uploadError instanceof Error ? uploadError.message : 'Unknown',
    })
    return NextResponse.json(
      { error: 'Server error', code: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const { id: studentId } = await ctx.params

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

  const authorized = await canAccessStudent(profile.id, profile.role, studentId, tenant.id)
  if (!authorized) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const parsed = DeleteBodySchema.safeParse(body)
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

  const student = await prisma.student.findFirst({
    where: { id: studentId, tenant_id: tenant.id },
    select: { id: true, intake_files: true },
  })

  if (!student) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  const existing = parseIntakeFiles(student.intake_files)
  const next = existing.filter(e => e.url !== parsed.data.url)
  if (next.length === existing.length) {
    return NextResponse.json(
      { error: 'Not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  await prisma.student.update({
    where: { id: studentId },
    data: { intake_files: next.length ? next : Prisma.DbNull },
  })

  return NextResponse.json({ data: { ok: true } })
}
