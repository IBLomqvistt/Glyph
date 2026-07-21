export type EditorialLabels = {
  audienceRelevance: number
  frontierImportance: number
  novelty: number
  evidenceQuality: number
  timeliness: number
  investorRelevance: number
  technicalDifficulty: number
}

export type EditorialScore = {
  normalizedScore: number
  score: number
  normalized: Record<string, number>
}

export function calculateEditorialScore(labels: EditorialLabels): EditorialScore

export function calculateFinalScore(input: {
  editorialScore: number
  positiveSimilarity: number
  negativeSimilarity: number
  sourcePriority: number
  explorationValue: number
}): { normalizedScore: number; score: number }
