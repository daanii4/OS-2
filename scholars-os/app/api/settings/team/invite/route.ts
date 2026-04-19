import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'
import { sendInviteTempPasswordEmail } from '@/lib/email/templates'
import { getPublicAppUrl } from '@/lib/app-url'
import { generateInviteTempPassword } from '@/lib/invite-password'

const InviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  role: z.enum(['assistant', 'counselor']),
})

export async function POST(req: NextRequest) {
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

  const tenant = await getTenantFromRequest()
  if (!profile.tenant_id || profile.tenant_id !== tenant.id) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid input', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const parsed = InviteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION_ERROR', detail: parsed.error.flatten() },
      { status: 400 }
    )
  }

  if (profile.role === 'assistant' && parsed.data.role === 'assistant') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  const { email, name, role } = parsed.data

  const existing = await prisma.profile.findFirst({
    where: {
      tenant_id: tenant.id,
      email: { equals: email, mode: 'insensitive' },
    },
  })
  if (existing) {
    return NextResponse.json(
      {
        error: 'A user with this email already exists in this organization',
        code: 'VALIDATION_ERROR',
      },
      { status: 400 }
    )
  }

  const appUrl = getPublicAppUrl()
  const loginUrl = `${appUrl}/login?invite=1`
  const tempPassword = generateInviteTempPassword()

  // If invitees get a second email with only a password, disable that template in
  // Supabase Dashboard → Authentication → Emails (our Resend email below is the full invite).
  const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      name,
      role,
      tenant_id: tenant.id,
      must_reset_password: true,
    },
  })

  if (createError || !authData.user) {
    const msg = createError?.message ?? ''
    if (/already|registered|exists/i.test(msg)) {
      return NextResponse.json(
        {
          error: 'An account with this email already exists. Remove them from another org or use a different email.',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }
    console.error('[settings/team/invite] Supabase createUser failed:', createError?.message)
    return NextResponse.json({ error: 'Server error', code: 'SERVER_ERROR' }, { status: 500 })
  }

  await prisma.profile.upsert({
    where: { id: authData.user.id },
    update: {
      name,
      email,
      role,
      tenant_id: tenant.id,
      must_reset_password: true,
      onboarding_complete: false,
      onboarding_step: 0,
    },
    create: {
      id: authData.user.id,
      name,
      email,
      role,
      tenant_id: tenant.id,
      active: true,
      must_reset_password: true,
      onboarding_complete: false,
      onboarding_step: 0,
    },
  })

  await prisma.invitation.create({
    data: {
      tenant_id: tenant.id,
      email,
      name,
      role,
      invited_by: profile.id,
      status: 'pending',
    },
  })

  sendInviteTempPasswordEmail({
    to: email,
    name,
    role,
    invitedBy: profile.name,
    tenantName: tenant.name,
    loginUrl,
    tempPassword,
  }).catch(err => {
    console.error('[settings/team/invite] Invite email failed:', err instanceof Error ? err.message : 'Unknown')
  })

  return NextResponse.json({ data: { success: true } }, { status: 201 })
}
