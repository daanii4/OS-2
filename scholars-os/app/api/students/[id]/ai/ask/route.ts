/**
 * POST /api/students/[id]/ai/ask
 * Counselor asks a free-form question about their student.
 * Saves result as triggered_by: 'counselor_request'.
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { canAccessStudent, getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getStudentContext } from '@/lib/ai/context'
import { validateAIResponse, type AIAnalysisResponse } from '@/lib/ai/validation'
import { ANALYSIS_SYSTEM_PROMPT } from '@/lib/ai/prompts'

const AskSchema = z.object({
  question: z.string().trim().min(10).max(1000),
})

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(req: Request, ctx: RouteContext) {
  const openai = new OpenAI()
  const { id: studentId } = await ctx.params

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

  const authorized = await canAccessStudent(profile.id, profile.role, studentId)
  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = AskSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION_ERROR', detail: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const context = await getStudentContext(studentId)

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2048,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `${JSON.stringify(context)}\n\nCounselor question: ${parsed.data.question}`,
        },
      ],
    })

    const raw = response.choices[0]?.message?.content
    if (!raw) {
      throw new Error('Empty response from OpenAI')
    }

    let aiResponse: AIAnalysisResponse
    try {
      aiResponse = JSON.parse(raw) as AIAnalysisResponse
    } catch {
      throw new Error('Failed to parse OpenAI response as JSON')
    }

    if (!validateAIResponse(aiResponse)) {
      throw new Error('Response rejected: intervention missing trusted source URL')
    }

    const saved = await prisma.aiAnalysis.create({
      data: {
        student_id: studentId,
        triggered_by: 'counselor_request',
        problem_analysis: aiResponse.problem_analysis,
        next_session_guide: aiResponse.next_session_guide,
        recommended_interventions: aiResponse.recommended_interventions as object[],
        escalation_flag: aiResponse.escalation_flag,
        escalation_reason: aiResponse.escalation_reason ?? null,
        counselor_action: 'pending',
      },
      select: {
        id: true,
        triggered_by: true,
        problem_analysis: true,
        next_session_guide: true,
        recommended_interventions: true,
        escalation_flag: true,
        escalation_reason: true,
        counselor_action: true,
        created_at: true,
      },
    })

    if (aiResponse.escalation_flag) {
      await prisma.student.update({
        where: { id: studentId },
        data: { escalation_active: true },
      })
    }

    return NextResponse.json({ data: saved }, { status: 201 })
  } catch (err) {
    console.error('[ai/ask/POST] Failed', {
      studentId,
      counselorId: profile.id,
      error: err instanceof Error ? err.message : 'Unknown',
    })
    return NextResponse.json({ error: 'AI analysis failed', code: 'SERVER_ERROR' }, { status: 500 })
  }
}
