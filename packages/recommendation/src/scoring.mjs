const EDITORIAL_WEIGHTS = Object.freeze({
  audienceRelevance: 0.3,
  frontierImportance: 0.25,
  novelty: 0.2,
  evidenceQuality: 0.15,
  timeliness: 0.1,
})

const roundToOneDecimal = (value) => Math.round(value * 10) / 10

function assertUnitInterval(name, value) {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`${name} must be between 0 and 1`)
  }
}

export function calculateEditorialScore(labels) {
  const normalized = Object.fromEntries(
    Object.entries(labels).map(([name, value]) => {
      if (!Number.isFinite(value) || value < 0 || value > 5) {
        throw new RangeError(`${name} must be between 0 and 5`)
      }
      return [name, value / 5]
    }),
  )

  const normalizedScore = Object.entries(EDITORIAL_WEIGHTS).reduce(
    (total, [name, weight]) => total + normalized[name] * weight,
    0,
  )

  return {
    normalizedScore,
    score: roundToOneDecimal(normalizedScore * 100),
    normalized,
  }
}

export function calculateFinalScore(input) {
  const values = {
    editorialScore: input.editorialScore,
    positiveSimilarity: input.positiveSimilarity,
    negativeSimilarity: input.negativeSimilarity,
    sourcePriority: input.sourcePriority,
    explorationValue: input.explorationValue,
  }
  Object.entries(values).forEach(([name, value]) =>
    assertUnitInterval(name, value),
  )

  const normalizedScore =
    0.55 * input.editorialScore +
    0.25 * input.positiveSimilarity +
    0.1 * input.sourcePriority +
    0.1 * input.explorationValue -
    0.05 * input.negativeSimilarity

  return {
    normalizedScore,
    score: roundToOneDecimal(normalizedScore * 100),
  }
}
