import { describe, expect, it } from 'vitest'

import { calculateEditorialScore, calculateFinalScore } from './scoring.mjs'

const labels = {
  audienceRelevance: 5,
  frontierImportance: 5,
  novelty: 4.7,
  evidenceQuality: 3.2,
  timeliness: 5,
  investorRelevance: 4.6,
  technicalDifficulty: 4.8,
}

describe('worked-example scoring', () => {
  it('calculates the PRD editorial score from normalized labels', () => {
    expect(calculateEditorialScore(labels).score).toBeCloseTo(93.4, 1)
  })

  it('calculates the final score instead of accepting a UI constant', () => {
    const editorial = calculateEditorialScore(labels)
    expect(
      calculateFinalScore({
        editorialScore: editorial.normalizedScore,
        positiveSimilarity: 0.804,
        negativeSimilarity: 0.377,
        sourcePriority: 1,
        explorationValue: 0.8,
      }).score,
    ).toBeCloseTo(87.6, 1)
  })
})
