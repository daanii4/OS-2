import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase/admin'

const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  role: z.enum(['counselor', 'assistant']),
})

export async function GET() {
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
  if (profile.role !== 'owner' && profile.role !== 'assistant') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  const users = await prisma.profile.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      created_at: true,
      _count: { select: { assigned_students: true } },
    },
    orderBy: { created_at: 'asc' },
  })

  return NextResponse.json({ data: users })
}

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
  if (profile.role !== 'owner' && profile.role !== 'assistant') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = CreateUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION_ERROR', detail: parsed.error.flatten() },
      { status: 400 }
    )
  }

  // assistants cannot create other assistants
  if (profile.role === 'assistant' && parsed.data.role === 'assistant') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  try {
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        name: parsed.data.name,
        role: parsed.data.role,
      },
    })

    if (createError || !newUser.user) {
      console.error('[org/users/POST] Supabase admin createUser error:', createError?.message)
      return NextResponse.json({ error: 'Failed to create user', code: 'SERVER_ERROR' }, { status: 500 })
    }

    // Profile row is created by the handle_new_user trigger.
    // Wait briefly and fetch it to return to the client.
    const created = await prisma.profile.findUnique({
      where: { id: newUser.user.id },
      select: { id: true, name: true, email: true, role: true, active: true, created_at: true },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (err) {
    console.error('[org/users/POST] Unexpected error:', err instanceof Error ? err.message : 'Unknown')
    return NextResponse.json({ error: 'Server error', code: 'SERVER_ERROR' }, { status: 500 })
  }
}
