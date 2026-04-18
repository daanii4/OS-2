import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'

const AccountSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
})

export async function PATCH(req: NextRequest) {
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

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid input', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const parsed = AccountSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION_ERROR', detail: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    if (parsed.data.name) {
      await prisma.profile.update({
        where: { id: user.id },
        data: { name: parsed.data.name },
      })
    }

    if (parsed.data.email && parsed.data.email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email: parsed.data.email })
      if (emailError) {
        console.error('[settings/account] email update:', emailError.message)
        return NextResponse.json({ error: 'Server error', code: 'SERVER_ERROR' }, { status: 500 })
      }
      await prisma.profile.update({
        where: { id: user.id },
        data: { email: parsed.data.email },
      })
    }

    const updated = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, role: true },
    })

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[settings/account]', err instanceof Error ? err.message : 'Unknown')
    return NextResponse.json({ error: 'Server error', code: 'SERVER_ERROR' }, { status: 500 })
  }
}
