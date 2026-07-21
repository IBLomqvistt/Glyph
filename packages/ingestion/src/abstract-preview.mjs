export function createAbstractPreview(introduction, wordLimit = 20) {
  if (!Number.isInteger(wordLimit) || wordLimit < 1) {
    throw new RangeError('wordLimit must be a positive integer')
  }

  const words = String(introduction).trim().split(/\s+/).filter(Boolean)
  const preview = words.slice(0, wordLimit).join(' ')
  return words.length > wordLimit ? `${preview}...` : preview
}
