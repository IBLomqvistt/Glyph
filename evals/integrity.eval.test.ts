import { describe, expect, it } from 'vitest'
import {
  EvidenceSpanSchema,
  MarketMetricSchema,
  VisualSpecSchema,
  publicationBlockers,
  schemaVersion,
} from '../packages/domain/src/index'
import {
  buildQuoteMatchingAgentPrompt,
  buildReportAgentPrompt,
} from '../packages/ai/src/index'
import { buildSyntheticEdition } from '../fixtures/glyph-agent-swarm-demo/source'

describe('Glyph integrity evals', () => {
  it('keeps report synthesis and quote matching inside the supplied corpus', async () => {
    const edition = await buildSyntheticEdition()
    const evidenceCorpus = edition.evidenceSpans.map((span) => ({
      id: span.id,
      paperVersionId: span.paperVersionId,
      pageNumber: span.pageNumber,
      section: span.section,
      exactText: span.exactText,
    }))
    const reportPrompt = buildReportAgentPrompt({
      paperVersionId: edition.version.id,
      title: edition.paper.title,
      authors: edition.paper.authors,
      publicationDate: edition.version.publicationDate,
      originalUrl: edition.paper.canonicalUrl,
      evidenceCorpus,
      technicalConceptContext: edition.concepts.map(
        (concept) => concept.contextualExplanation,
      ),
    })
    const matchingPrompt = buildQuoteMatchingAgentPrompt({
      paperVersionId: edition.version.id,
      claims: edition.claims.map((claim) => ({
        id: claim.id,
        text: claim.text,
        kind: claim.kind,
      })),
      evidenceCorpus,
    })

    expect(reportPrompt).toContain(
      'Every material statement must reference one or more supplied evidenceSpanIds.',
    )
    expect(reportPrompt).toContain('“No direct trade implication”')
    expect(matchingPrompt).toContain('Otherwise return INSUFFICIENT_EVIDENCE')
    expect(matchingPrompt).toContain('evidence-no-trade')
  })

  it('rejects malformed and out-of-range evidence instead of estimating a location', () => {
    const parsed = EvidenceSpanSchema.safeParse({
      schemaVersion,
      id: 'malformed',
      paperVersionId: 'wrong-version',
      pageNumber: 0,
      section: '',
      exactText: '',
      boxes: [{ x: 0.95, y: 0.2, width: 0.2, height: 0.1 }],
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects numerical visual labels without units and unknown topology', () => {
    const parsed = VisualSpecSchema.safeParse({
      schemaVersion,
      id: 'bad-visual',
      title: 'Bad visual',
      purpose: 'Exercise fail-closed validation.',
      nodes: [
        { id: 'a', label: 'Value', kind: 'ANNOTATION', value: 4.5, unit: null },
      ],
      edges: [
        { id: 'bad-edge', from: 'a', to: 'missing', label: null, kind: 'FLOW' },
      ],
      groups: [],
      claimIds: [],
      evidenceSpanIds: [],
      layout: 'LEFT_TO_RIGHT',
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects market metrics missing a denominator or conditions', () => {
    const parsed = MarketMetricSchema.safeParse({
      schemaVersion,
      id: 'metric-incomplete',
      sourceUrl: 'https://example.com/synthetic-metric',
      retrievalDate: '2026-07-21',
      modelOrProductVersion: 'synthetic-v1',
      value: 4.5,
      unit: 'ratio',
      denominator: '',
      conditions: '',
      relevance: 'Synthetic eval only',
      comparisonLimitations: 'Not comparable to production data',
    })
    expect(parsed.success).toBe(false)
  })

  it.each([
    'sourceUrl',
    'retrievalDate',
    'modelOrProductVersion',
    'unit',
    'denominator',
    'conditions',
    'relevance',
    'comparisonLimitations',
  ] as const)('rejects a market metric missing %s', (field) => {
    const completeMetric = {
      schemaVersion,
      id: 'metric-complete',
      sourceUrl: 'https://example.com/synthetic-metric',
      retrievalDate: '2026-07-21',
      modelOrProductVersion: 'synthetic-v1',
      value: 4.5,
      unit: 'ratio',
      denominator: '20 synthetic milliseconds',
      conditions: 'Synthetic fixture only',
      relevance: 'Schema validation exercise',
      comparisonLimitations: 'Not comparable to production data',
    }
    const incompleteMetric: Record<string, unknown> = { ...completeMetric }
    delete incompleteMetric[field]
    expect(MarketMetricSchema.safeParse(incompleteMetric).success).toBe(false)
  })

  it.each([
    ['pageMappingsValidated', 'PAGE_MAPPING_INVALID'],
    ['definitionsValidated', 'DEFINITION_VALIDATION_FAILED'],
    ['claimKindsDistinct', 'CLAIM_KIND_AMBIGUOUS'],
  ] as const)('blocks publication when %s is false', async (field, code) => {
    const edition = await buildSyntheticEdition()
    const blockers = publicationBlockers({
      report: edition.report,
      paperVersion: edition.version,
      claims: edition.claims,
      evidenceSpans: edition.evidenceSpans,
      visuals: edition.visuals,
      marketMetrics: [],
      integrityReview: {
        pageMappingsValidated: true,
        definitionsValidated: true,
        claimKindsDistinct: true,
        visualsValidated: true,
        [field]: false,
      },
    })
    expect(blockers.map((blocker) => blocker.code)).toContain(code)
  })

  it('blocks wrong-version evidence and preserves insufficient-evidence Q&A', async () => {
    const edition = await buildSyntheticEdition()
    const blockers = publicationBlockers({
      report: edition.report,
      paperVersion: edition.version,
      claims: edition.claims,
      evidenceSpans: edition.evidenceSpans.map((span, index) =>
        index === 0 ? { ...span, paperVersionId: 'wrong-version' } : span,
      ),
      visuals: edition.visuals,
      marketMetrics: [],
      integrityReview: {
        pageMappingsValidated: true,
        definitionsValidated: true,
        claimKindsDistinct: true,
        visualsValidated: true,
      },
    })
    expect(blockers.map((blocker) => blocker.code)).toContain(
      'EVIDENCE_VERSION_MISMATCH',
    )
    const unsupported = edition.answers.find(
      (answer) => answer.outcome === 'INSUFFICIENT_EVIDENCE',
    )
    expect(unsupported?.answerText).toBeNull()
    expect(unsupported?.evidenceSpanIds).toEqual([])
  })

  it('blocks every record-level publication integrity failure', async () => {
    const edition = await buildSyntheticEdition()
    const baseInput = {
      report: edition.report,
      paperVersion: edition.version,
      claims: edition.claims,
      evidenceSpans: edition.evidenceSpans,
      visuals: edition.visuals,
      marketMetrics: [] as unknown[],
      integrityReview: {
        pageMappingsValidated: true,
        definitionsValidated: true,
        claimKindsDistinct: true,
        visualsValidated: true,
      },
    }
    const firstClaim = edition.claims[0]
    const firstEvidence = edition.evidenceSpans[0]
    const firstVisual = edition.visuals[0]
    expect(firstClaim).toBeDefined()
    expect(firstEvidence).toBeDefined()
    expect(firstVisual).toBeDefined()
    if (!firstClaim || !firstEvidence || !firstVisual) return

    const scenarios = [
      {
        code: 'MATERIAL_CLAIM_WITHOUT_EVIDENCE',
        input: {
          ...baseInput,
          claims: edition.claims.map((candidate, index) =>
            index === 0
              ? {
                  ...candidate,
                  material: true,
                  supportStatus: 'INSUFFICIENT_EVIDENCE' as const,
                  evidenceSpanIds: [],
                }
              : candidate,
          ),
        },
      },
      {
        code: 'EVIDENCE_PAGE_OUT_OF_RANGE',
        input: {
          ...baseInput,
          evidenceSpans: edition.evidenceSpans.map((candidate, index) =>
            index === 0
              ? { ...candidate, pageNumber: edition.version.pageCount + 1 }
              : candidate,
          ),
        },
      },
      {
        code: 'VISUAL_REFERENCE_UNKNOWN',
        input: {
          ...baseInput,
          visuals: edition.visuals.map((candidate, index) =>
            index === 0
              ? {
                  ...candidate,
                  claimIds: [...candidate.claimIds, 'unknown-claim'],
                  evidenceSpanIds: [
                    ...candidate.evidenceSpanIds,
                    'unknown-evidence',
                  ],
                }
              : candidate,
          ),
        },
      },
      {
        code: 'VISUAL_VALIDATION_FAILED',
        input: {
          ...baseInput,
          integrityReview: {
            ...baseInput.integrityReview,
            visualsValidated: false,
          },
        },
      },
      {
        code: 'MARKET_METRIC_INVALID',
        input: {
          ...baseInput,
          marketMetrics: [{ value: 4.5, unit: 'ratio' }],
        },
      },
      {
        code: 'SYNTHETIC_DEMO_NOT_PUBLISHABLE',
        input: baseInput,
      },
      {
        code: 'REPORT_NOT_EDITOR_APPROVED',
        input: {
          ...baseInput,
          report: { ...edition.report, status: 'QA_BLOCKED' as const },
        },
      },
      {
        code: 'EDITOR_APPROVAL_MISSING',
        input: {
          ...baseInput,
          report: { ...edition.report, editorApproval: null },
        },
      },
    ]

    for (const scenario of scenarios) {
      expect(
        publicationBlockers(scenario.input).map((blocker) => blocker.code),
        `expected ${scenario.code}`,
      ).toContain(scenario.code)
    }
  })
})
