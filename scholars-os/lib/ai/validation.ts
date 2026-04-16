export const TRUSTED_DOMAINS = [
  'pbis.org',
  'casel.org',
  'samhsa.gov',
  'nasponline.org',
  'schoolmentalhealth.org',
  'ies.ed.gov',
  'cdc.gov',
] as const

export type PlanOfActionData = {
  milestone_week: number
  milestone_target: string
  focus_areas: string[]
  opening_strategy: string
  techniques: Array<{ name: string; description: string; source_url: string }>
  check_in_questions: string[]
  session_goal_suggestions: string[]
  red_flags: string[] | null
}

export type AIAnalysisResponse = {
  problem_analysis: string
  next_session_guide: string
  recommended_interventions: Array<{
    intervention: string
    rationale: string
    source: { name: string; url: string }
  }>
  plan_of_action: PlanOfActionData | null
  escalation_flag: boolean
  escalation_reason: string | null
}

function urlIsTrusted(url: string): boolean {
  try {
    const parsed = new URL(url)
    return TRUSTED_DOMAINS.some(
      domain => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    )
  } catch {
    return false
  }
}

function validatePlanOfActionStructure(po: unknown): boolean {
  if (po === null || typeof po !== 'object') return false
  const p = po as Record<string, unknown>

  if (typeof p.milestone_week !== 'number' || !Number.isFinite(p.milestone_week)) return false
  if (typeof p.milestone_target !== 'string' || !p.milestone_target.trim()) return false
  if (typeof p.opening_strategy !== 'string' || !p.opening_strategy.trim()) return false

  if (!Array.isArray(p.focus_areas) || p.focus_areas.length < 2 || p.focus_areas.length > 3)
    return false
  if (!p.focus_areas.every(f => typeof f === 'string' && f.trim())) return false

  if (!Array.isArray(p.techniques) || p.techniques.length < 2 || p.techniques.length > 3) return false
  for (const t of p.techniques) {
    if (typeof t !== 'object' || t === null) return false
    const tech = t as Record<string, unknown>
    if (typeof tech.name !== 'string' || !tech.name.trim()) return false
    if (typeof tech.description !== 'string' || !tech.description.trim()) return false
    if (typeof tech.source_url !== 'string' || !urlIsTrusted(tech.source_url)) return false
  }

  if (!Array.isArray(p.check_in_questions) || p.check_in_questions.length < 2 || p.check_in_questions.length > 3)
    return false
  if (!p.check_in_questions.every(q => typeof q === 'string' && q.trim())) return false

  if (
    !Array.isArray(p.session_goal_suggestions) ||
    p.session_goal_suggestions.length < 2 ||
    p.session_goal_suggestions.length > 3
  )
    return false
  if (!p.session_goal_suggestions.every(g => typeof g === 'string' && g.trim())) return false

  const rf = p.red_flags
  if (rf !== undefined && rf !== null) {
    if (!Array.isArray(rf)) return false
    if (!rf.every(f => typeof f === 'string' && f.trim())) return false
  }

  return true
}

/**
 * Validates that every recommended intervention has a source URL
 * from a trusted behavioral framework domain.
 *
 * Returns false if:
 * - No interventions in the response
 * - Any intervention has no source.url
 * - Any source.url is not from a trusted domain
 *
 * Exception: if escalation_flag is true, interventions may be empty
 * (escalation is the only recommendation in that case).
 *
 * When escalation_flag is false, plan_of_action must be present and valid.
 */
export function validateAIResponse(response: AIAnalysisResponse): boolean {
  if (response.escalation_flag) {
    return true
  }

  if (!response.recommended_interventions?.length) return false

  const interventionsOk = response.recommended_interventions.every(item => {
    const url = item.source?.url
    if (!url) return false
    return urlIsTrusted(url)
  })
  if (!interventionsOk) return false

  if (response.plan_of_action === null || response.plan_of_action === undefined) return false
  return validatePlanOfActionStructure(response.plan_of_action)
}

export function parsePlanOfAction(json: unknown): PlanOfActionData | null {
  if (json === null || typeof json !== 'object') return null
  if (!validatePlanOfActionStructure(json)) return null
  const p = json as Record<string, unknown>
  return {
    milestone_week: p.milestone_week as number,
    milestone_target: p.milestone_target as string,
    focus_areas: p.focus_areas as string[],
    opening_strategy: p.opening_strategy as string,
    techniques: p.techniques as PlanOfActionData['techniques'],
    check_in_questions: p.check_in_questions as string[],
    session_goal_suggestions: p.session_goal_suggestions as string[],
    red_flags: p.red_flags === undefined ? null : (p.red_flags as string[] | null),
  }
}
