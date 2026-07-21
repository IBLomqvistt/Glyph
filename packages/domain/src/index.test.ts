import { describe, expect, it } from 'vitest'
import {
  ClaimSchema,
  editorialReviewBlockers,
  MarketMetricSchema,
  NormalizedBoxSchema,
  NewsletterSchema,
  QuestionAnswerSchema,
  publicationBlockers,
  schemaVersion,
  type Claim,
  type EvidenceSpan,
  type PaperVersion,
  type Report,
  type VisualSpec,
} from './index'

const paperVersion: PaperVersion = {
  schemaVersion,
  id: 'version-1',
  paperId: 'paper-1',
  versionLabel: 'demo-v1',
  checksumSha256: 'a'.repeat(64),
  licenceStatus: 'PUBLIC',
  publicationDate: '2026-07-21',
  revisionDate: '2026-07-21',
  pageCount: 3,
  assetPath: '/fixtures/demo.pdf',
}

const evidence: EvidenceSpan = {
  schemaVersion,
  id: 'evidence-1',
  paperVersionId: paperVersion.id,
  pageNumber: 1,
  section: 'Abstract',
  exactText: 'Synthetic evidence text.',
  boxes: [{ x: 0.1, y: 0.2, width: 0.5, height: 0.1 }],
}

const claim: Claim = {
  schemaVersion,
  id: 'claim-1',
  reportId: 'report-1',
  text: 'The synthetic system decomposes work.',
  kind: 'AUTHOR_CLAIM',
  material: true,
  supportStatus: 'SUPPORTED',
  evidenceSpanIds: [evidence.id],
}

const report: Report = {
  schemaVersion,
  id: 'report-1',
  paperVersionId: paperVersion.id,
  slug: 'synthetic-demo',
  status: 'APPROVED',
  readingTimeMinutes: 8,
  sectionIds: ['section-1'],
  claimIds: [claim.id],
  conceptIds: [],
  visualIds: ['visual-1'],
  createdAt: '2026-07-21T00:00:00.000Z',
  updatedAt: '2026-07-21T00:00:00.000Z',
  editorApproval: {
    editorId: 'editor-1',
    approvedAt: '2026-07-21T00:00:00.000Z',
  },
}

const visual: VisualSpec = {
  schemaVersion,
  id: 'visual-1',
  title: 'Synthetic flow',
  purpose: 'Explain the test flow.',
  nodes: [
    { id: 'node-1', label: 'Input', kind: 'INPUT', value: null, unit: null },
  ],
  edges: [],
  groups: [],
  claimIds: [claim.id],
  evidenceSpanIds: [evidence.id],
  layout: 'LEFT_TO_RIGHT',
}

describe('domain validation', () => {
  it('requires evidence for a supported material claim', () => {
    const result = ClaimSchema.safeParse({ ...claim, evidenceSpanIds: [] })
    expect(result.success).toBe(false)
  })

  it('rejects boxes that exceed normalized page bounds', () => {
    const result = NormalizedBoxSchema.safeParse({
      x: 0.8,
      y: 0.1,
      width: 0.3,
      height: 0.2,
    })
    expect(result.success).toBe(false)
  })

  it('requires complete market metric context', () => {
    const result = MarketMetricSchema.safeParse({
      schemaVersion,
      id: 'metric-1',
      sourceUrl: 'https://example.com/metric',
      retrievalDate: '2026-07-21',
      modelOrProductVersion: 'demo-v1',
      value: 1,
      unit: '',
      denominator: '',
      conditions: 'Synthetic condition',
      relevance: 'Test relevance',
      comparisonLimitations: 'Not comparable to real data',
    })
    expect(result.success).toBe(false)
  })

  it('enforces the five-bullet newsletter contract', () => {
    expect(
      NewsletterSchema.safeParse({ reportId: report.id, bullets: ['one'] })
        .success,
    ).toBe(false)
  })

  it('prevents speculative text for insufficient evidence', () => {
    const result = QuestionAnswerSchema.safeParse({
      schemaVersion,
      id: 'answer-1',
      reportId: report.id,
      question: 'What is the market impact?',
      outcome: 'INSUFFICIENT_EVIDENCE',
      answerText: 'Perhaps it changes costs.',
      evidenceSpanIds: [],
      generatedAt: '2026-07-21T00:00:00.000Z',
      validatedAt: '2026-07-21T00:00:00.000Z',
    })
    expect(result.success).toBe(false)
  })
})

describe('publication eligibility', () => {
  it('allows a fully supported and approved report', () => {
    expect(
      publicationBlockers({
        report,
        paperVersion,
        claims: [claim],
        evidenceSpans: [evidence],
        visuals: [visual],
        marketMetrics: [],
        integrityReview: {
          pageMappingsValidated: true,
          definitionsValidated: true,
          claimKindsDistinct: true,
          visualsValidated: true,
        },
      }),
    ).toEqual([])
  })

  it('fails closed for wrong-version evidence and missing approval', () => {
    const blockers = publicationBlockers({
      report: { ...report, status: 'QA_BLOCKED', editorApproval: null },
      paperVersion,
      claims: [claim],
      evidenceSpans: [{ ...evidence, paperVersionId: 'version-2' }],
      visuals: [visual],
      marketMetrics: [],
      integrityReview: {
        pageMappingsValidated: true,
        definitionsValidated: true,
        claimKindsDistinct: true,
        visualsValidated: true,
      },
    })
    expect(blockers.map((blocker) => blocker.code)).toEqual(
      expect.arrayContaining([
        'EVIDENCE_VERSION_MISMATCH',
        'REPORT_NOT_EDITOR_APPROVED',
        'EDITOR_APPROVAL_MISSING',
      ]),
    )
  })

  it('allows local review but never publication for a synthetic fixture', () => {
    const input = {
      report,
      paperVersion: { ...paperVersion, licenceStatus: 'SYNTHETIC' as const },
      claims: [claim],
      evidenceSpans: [evidence],
      visuals: [visual],
      marketMetrics: [],
      integrityReview: {
        pageMappingsValidated: true,
        definitionsValidated: true,
        claimKindsDistinct: true,
        visualsValidated: true,
      },
    }
    expect(editorialReviewBlockers(input)).toEqual([])
    expect(publicationBlockers(input).map((blocker) => blocker.code)).toContain(
      'SYNTHETIC_DEMO_NOT_PUBLISHABLE',
    )
  })
})
