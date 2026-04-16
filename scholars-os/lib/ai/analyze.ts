import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { getStudentContext } from './context'
import { validateAIResponse, type AIAnalysisResponse } from './validation'
import { ANALYSIS_SYSTEM_PROMPT } from './prompts'

// Must match ai_analyses.triggered_by enum in schema.prisma
export type AITrigger =
  | 'new_session'
  | 'new_incident'
  | 'plan_creation'
  | 'milestone_missed'
  | 'counselor_request'
  | 'regression_alert'

/**
 * Trigger an AI analysis for a student. Always called fire-and-forget.
 * The caller does NOT await this function.
 *
 * Usage:
 *   triggerAIAnalysis(studentId, 'new_session', sessionId).catch(err => {
 *     console.error('[ai/analyze] Background analysis failed:', err)
 *   })
 */
export async function triggerAIAnalysis(
  studentId: string,
  triggeredBy: AITrigger,
  linkedSessionId?: string
): Promise<void> {
  const openai = new OpenAI()
  const context = await getStudentContext(studentId)

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 4096,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify(context) },
    ],
  })

  const raw = response.choices[0]?.message?.content
  if (!raw) {
    throw new Error('[ai/analyze] Empty response from OpenAI')
  }

  let parsed: AIAnalysisResponse
  try {
    parsed = JSON.parse(raw) as AIAnalysisResponse
  } catch {
    throw new Error('[ai/analyze] Failed to parse OpenAI response as JSON')
  }

  if (!validateAIResponse(parsed)) {
    throw new Error(
      '[ai/analyze] Response rejected: invalid interventions or plan_of_action (trusted URLs required)'
    )
  }

  await prisma.aiAnalysis.create({
    data: {
      student_id: studentId,
      triggered_by: triggeredBy,
      problem_analysis: parsed.problem_analysis,
      next_session_guide: parsed.next_session_guide,
      recommended_interventions: parsed.recommended_interventions as object[],
      plan_of_action:
        parsed.escalation_flag || parsed.plan_of_action == null
          ? undefined
          : (parsed.plan_of_action as object),
      escalation_flag: parsed.escalation_flag,
      escalation_reason: parsed.escalation_reason ?? null,
      counselor_action: 'pending',
      linked_session_id: linkedSessionId ?? undefined,
    },
  })

  if (parsed.escalation_flag) {
    await prisma.student.update({
      where: { id: studentId },
      data: { escalation_active: true },
    })
  }
}
