import { describe, expect, it } from 'vitest'

import {
  EditorialPackageOutputSchema,
  IntegrityReviewOutputSchema,
  PaperLabelOntologySchema,
} from './runtime-agents.js'

describe('runtime agent contracts', () => {
  it('requires an explicit versioned paper-label ontology', () => {
    expect(() =>
      PaperLabelOntologySchema.parse({
        id: 'paper-label-ontology.v1',
        version: 1,
        status: 'ACTIVE',
        rules: [],
        acceptanceThreshold: 0.7,
        reviewBand: 0.05,
        approvedAt: '2026-07-21T00:00:00.000Z',
        approvedBy: 'editor-1',
      }),
    ).toThrow()
  })

  it('makes integrity pass equivalent to an empty blocker set', () => {
    expect(() =>
      IntegrityReviewOutputSchema.parse({
        passed: true,
        blockers: [
          { code: 'UNKNOWN_EVIDENCE', message: 'Missing', recordId: null },
        ],
        warnings: [],
        coverage: {
          materialClaims: 1,
          supportedMaterialClaims: 0,
          evidenceReferencesChecked: 0,
          conceptsChecked: 0,
          marketClaimsChecked: 0,
        },
      }),
    ).toThrow(/empty blocker set/)
  })

  it('requires exactly five newsletter bullets', () => {
    expect(
      EditorialPackageOutputSchema.safeParse({
        headline: 'A report',
        reviewSummary: 'Ready for review',
        newsletterBullets: ['one', 'two', 'three', 'four'],
        socialPosts: ['A post'],
      }).success,
    ).toBe(false)
  })
})
