export const kimiQuestionMinLength = 3
export const kimiQuestionMaxLength = 500

export type KimiQuestionResponse = {
  outcome: 'ANSWER' | 'INSUFFICIENT_EVIDENCE'
  answerText: string | null
  evidenceIds: string[]
  model: string
  timestamp: string
}

export function isKimiQuestionResponse(
  value: unknown,
): value is KimiQuestionResponse {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }
  const record = value as Record<string, unknown>
  const outcome = record.outcome
  const answerText = record.answerText
  const evidenceIds = record.evidenceIds
  if (
    (outcome !== 'ANSWER' && outcome !== 'INSUFFICIENT_EVIDENCE') ||
    (answerText !== null && typeof answerText !== 'string') ||
    !Array.isArray(evidenceIds) ||
    !evidenceIds.every((id) => typeof id === 'string') ||
    typeof record.model !== 'string' ||
    typeof record.timestamp !== 'string'
  ) {
    return false
  }
  return outcome === 'ANSWER'
    ? typeof answerText === 'string' && evidenceIds.length > 0
    : answerText === null && evidenceIds.length === 0
}
