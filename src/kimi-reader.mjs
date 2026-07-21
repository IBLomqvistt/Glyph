export function resolveClaimEvidence(paper, evidenceCorpus, claimId) {
  const claim = paper.claims.find((item) => item.id === claimId)
  if (!claim) throw new RangeError(`Unknown claim ${claimId}`)

  const evidenceById = new Map(
    evidenceCorpus.spans.map((span) => [span.id, span]),
  )
  const evidence = claim.evidenceSpanIds.map((id) => {
    const span = evidenceById.get(id)
    if (!span) throw new RangeError(`Unknown evidence span ${id}`)
    return span
  })
  return { claim, evidence }
}
