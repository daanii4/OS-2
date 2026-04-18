import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

export async function POST() {
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

  const email = user.email
  if (!email) {
    return NextResponse.json({ error: 'Invalid input', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  try {
    const { error: metaError } = await supabase.auth.updateUser({
      data: { must_reset_password: false },
    })
    if (metaError) {
      console.error('[auth/complete-reset] updateUser metadata:', metaError.message)
      return NextResponse.json({ error: 'Server error', code: 'SERVER_ERROR' }, { status: 500 })
    }

    await prisma.profile.update({
      where: { id: user.id },
      data: { must_reset_password: false },
    })

    if (profile.tenant_id) {
      await prisma.invitation.updateMany({
        where: {
          email: { equals: email, mode: 'insensitive' },
          tenant_id: profile.tenant_id,
          status: 'pending',
        },
        data: { status: 'accepted', accepted_at: new Date() },
      })
    }

    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    console.error('[auth/complete-reset]', err instanceof Error ? err.message : 'Unknown')
    return NextResponse.json({ error: 'Server error', code: 'SERVER_ERROR' }, { status: 500 })
  }
}
