export const TRUSTED_DOMAINS = [
  'pbis.org',
  'casel.org',
  'samhsa.gov',
  'nasponline.org',
  'schoolmentalhealth.org',
  'ies.ed.gov',
  'cdc.gov',
] as const

export type AIAnalysisResponse = {
  problem_analysis: string
  next_session_guide: string
  recommended_interventions: Array<{
    intervention: string
    rationale: string
    source: { name: string; url: string }
  }>
  escalation_flag: boolean
  escalation_reason: string | null
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
 */
export function validateAIResponse(response: AIAnalysisResponse): boolean {
  // Escalation-only responses have no interventions — that is valid
  if (response.escalation_flag) return true

  if (!response.recommended_interventions?.length) return false

  return response.recommended_interventions.every(item => {
    const url = item.source?.url
    if (!url) return false

    try {
      const parsed = new URL(url)
      return TRUSTED_DOMAINS.some(
        domain => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
      )
    } catch {
      return false
    }
  })
}
