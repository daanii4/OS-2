import type { SessionType } from '@prisma/client'

/** Human-readable labels for district caseload `presenting_problems` (matches intake options). */
const SESSION_TYPE_LABEL: Record<SessionType, string> = {
  intake_assessment: 'Intake assessment',
  behavioral_observation: 'Behavioral observation',
  classroom_support: 'Classroom support',
  emotional_regulation: 'Emotional regulation',
  group_behavior_support: 'Group behavior support',
  peer_conflict_mediation: 'Peer conflict mediation',
  check_in: 'Check-in',
  crisis: 'Crisis',
}

export function sessionTypesToPresentingLabels(types: SessionType[]): string[] {
  return types.map(t => SESSION_TYPE_LABEL[t] ?? String(t).replace(/_/g, ' '))
}
