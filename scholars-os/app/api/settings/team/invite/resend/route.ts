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

const ResendSchema = z.object({
  invitationId: z.string().uuid(),
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

  const parsed = ResendSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION_ERROR', detail: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const invitation = await prisma.invitation.findFirst({
    where: {
      id: parsed.data.invitationId,
      tenant_id: tenant.id,
      status: 'pending',
    },
  })

  if (!invitation) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 })
  }

  const existingProfile = await prisma.profile.findFirst({
    where: {
      tenant_id: tenant.id,
      email: { equals: invitation.email, mode: 'insensitive' },
    },
    select: { id: true },
  })

  if (!existingProfile) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 })
  }

  const appUrl = getPublicAppUrl()
  const loginUrl = `${appUrl}/login?invite=1`
  const tempPassword = generateInviteTempPassword()

  // If a duplicate password-only email appears, disable the matching Auth template in Supabase.
  const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(existingProfile.id, {
    password: tempPassword,
    user_metadata: {
      name: invitation.name,
      role: invitation.role,
      tenant_id: tenant.id,
      must_reset_password: true,
    },
  })

  if (updateAuthError) {
    console.error('[settings/team/invite/resend] Supabase updateUser failed:', updateAuthError.message)
    return NextResponse.json({ error: 'Server error', code: 'SERVER_ERROR' }, { status: 500 })
  }

  sendInviteTempPasswordEmail({
    to: invitation.email,
    name: invitation.name,
    role: invitation.role,
    invitedBy: profile.name,
    tenantName: tenant.name,
    loginUrl,
    tempPassword,
  }).catch(err => {
    console.error('[settings/team/invite/resend] Email failed:', err instanceof Error ? err.message : 'Unknown')
  })

  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { resend_count: { increment: 1 } },
  })

  return NextResponse.json({ data: { success: true } })
}
