import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase/admin'

/** Cancel a pending invite: remove invitation row and auth user created for setup (no session data yet). */
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ invitationId: string }> }
) {
  const { invitationId } = await ctx.params

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

  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, tenant_id: tenant.id, status: 'pending' },
  })

  if (!invitation) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 })
  }

  if (profile.role === 'assistant' && invitation.role === 'assistant') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  const invitedProfile = await prisma.profile.findFirst({
    where: {
      tenant_id: tenant.id,
      email: { equals: invitation.email, mode: 'insensitive' },
    },
    select: { id: true },
  })

  try {
    if (invitedProfile) {
      const { error: delAuth } = await supabaseAdmin.auth.admin.deleteUser(invitedProfile.id)
      if (delAuth) {
        console.error('[team/invitations/DELETE] auth deleteUser:', delAuth.message)
        return NextResponse.json({ error: 'Server error', code: 'SERVER_ERROR' }, { status: 500 })
      }
      await prisma.profile.deleteMany({
        where: { id: invitedProfile.id, tenant_id: tenant.id },
      })
    }

    await prisma.invitation.delete({
      where: { id: invitation.id },
    })

    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    console.error('[team/invitations/DELETE]', err instanceof Error ? err.message : 'Unknown')
    return NextResponse.json({ error: 'Server error', code: 'SERVER_ERROR' }, { status: 500 })
  }
}
