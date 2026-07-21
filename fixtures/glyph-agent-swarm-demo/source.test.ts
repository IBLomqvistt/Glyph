import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import {
  buildSyntheticEdition,
  buildSyntheticPdf,
  syntheticDisclosure,
} from './source'

describe('synthetic Glyph edition', () => {
  it('generates identical PDF bytes and checksums twice', async () => {
    const first = await buildSyntheticPdf()
    const second = await buildSyntheticPdf()
    expect(second.bytes).toEqual(first.bytes)
    expect(second.checksumSha256).toBe(first.checksumSha256)
    expect(createHash('sha256').update(first.bytes).digest('hex')).toBe(
      first.checksumSha256,
    )
  })

  it('keeps every coordinate normalized and derived from source lines', async () => {
    const edition = await buildSyntheticEdition()
    expect(edition.evidenceSpans).toHaveLength(9)
    for (const span of edition.evidenceSpans) {
      expect(span.boxes[0]?.x).toBeGreaterThanOrEqual(0)
      expect(span.boxes[0]?.y).toBeGreaterThanOrEqual(0)
      expect(
        (span.boxes[0]?.x ?? 0) + (span.boxes[0]?.width ?? 0),
      ).toBeLessThanOrEqual(1)
      expect(
        (span.boxes[0]?.y ?? 0) + (span.boxes[0]?.height ?? 0),
      ).toBeLessThanOrEqual(1)
    }
  })

  it('is unmistakably synthetic and exercises all five claim kinds', async () => {
    const edition = await buildSyntheticEdition()
    expect(edition.disclosure).toBe(syntheticDisclosure)
    expect(edition.paper.sourceType).toBe('SYNTHETIC_DEMO')
    expect(new Set(edition.claims.map((claim) => claim.kind))).toEqual(
      new Set([
        'PAPER_FACT',
        'AUTHOR_CLAIM',
        'GLYPH_CALCULATION',
        'GLYPH_INTERPRETATION',
        'INVESTMENT_HYPOTHESIS',
      ]),
    )
    expect(
      edition.claims.some((claim) => claim.supportStatus === 'CONTRADICTED'),
    ).toBe(true)
    expect(
      edition.claims.some(
        (claim) => claim.supportStatus === 'INSUFFICIENT_EVIDENCE',
      ),
    ).toBe(true)
    expect(edition.newsletter.bullets).toHaveLength(5)
    expect(
      edition.newsletter.bullets.map((bullet) => bullet.split(':')[0]),
    ).toEqual([
      'Claim',
      'Who and why now',
      'Mechanism',
      'AI frontier relevance',
      'Investor relevance and concepts',
    ])
  })
})
