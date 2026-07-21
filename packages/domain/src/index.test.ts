import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

import {
  ClaimSchema,
  EvidenceLinkedClaimsSchema,
  EvidenceSpanSchema,
  NormalizedBoxSchema,
  SourceArtifactSchema,
  SourceRegistryEntrySchema,
  TechnicalLabelsSchema,
  VisualSpecSchema,
  publicationBlockers,
  schemaVersion,
  type PublicationInput,
} from './index.js'

describe('Glyph domain invariants', () => {
  it('preserves the Kimi launch blog classification and layer mapping', () => {
    const fixture = JSON.parse(
      readFileSync(
        new URL('../../../fixtures/papers/kimi-k3.json', import.meta.url),
        'utf8',
      ),
    ) as { source: unknown }
    const source = SourceArtifactSchema.parse(fixture.source)

    expect(source.canonicalUrl).toBe('https://www.kimi.com/blog/kimi-k3')
    expect(source.sourceType).toBe('FIRST_PARTY_TECHNICAL_LAUNCH_BLOG')
    expect(source.sourceType).not.toBe('TECHNICAL_REPORT')
    expect(source.primaryLayer).toBe('MODELS')
    expect(source.secondaryLayers).toEqual([
      'CHIPS_COMPUTE',
      'CLOUD_INFRASTRUCTURE',
      'APPLICATIONS',
    ])
    expect(source.technicalReportStatus).toBe('ANNOUNCED_NOT_ATTACHED')
  })

  it('validates the complete Kimi claim and evidence fixture', () => {
    const paperFixture = JSON.parse(
      readFileSync(
        new URL('../../../fixtures/papers/kimi-k3.json', import.meta.url),
        'utf8',
      ),
    ) as { claims: unknown; technicalLabels: unknown }
    const evidenceFixture = JSON.parse(
      readFileSync(
        new URL('../../../fixtures/evidence/kimi-k3.json', import.meta.url),
        'utf8',
      ),
    ) as { spans: unknown }

    const labels = TechnicalLabelsSchema.parse(paperFixture.technicalLabels)
    const corpus = EvidenceLinkedClaimsSchema.parse({
      claims: paperFixture.claims,
      evidenceSpans: evidenceFixture.spans,
    })

    expect(corpus.evidenceSpans).toHaveLength(10)
    expect(
      labels.resourceImplications.find(
        (label) => label.label === 'Claimed scaling efficiency improves',
      )?.claimType,
    ).toBe('AUTHOR_CLAIM')
  })

  it('rejects claims that reference an unknown evidence span', () => {
    const span = EvidenceSpanSchema.parse({
      schemaVersion,
      id: 'known-span',
      paperVersionId: 'version-1',
      pageNumber: 1,
      sectionTitle: 'Introduction',
      text: 'Known evidence.',
      boundingBoxes: [{ x: 0.1, y: 0.1, width: 0.2, height: 0.1 }],
    })
    const result = EvidenceLinkedClaimsSchema.safeParse({
      evidenceSpans: [span],
      claims: [
        {
          schemaVersion,
          id: 'claim-unknown-span',
          reportId: 'report-1',
          text: 'Claim with missing evidence.',
          kind: 'AUTHOR_CLAIM',
          material: true,
          supportStatus: 'SUPPORTED',
          evidenceSpanIds: ['missing-span'],
        },
      ],
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toMatch(/unknown evidence span/)
  })

  it('rejects prohibited sources that are enabled', () => {
    const result = SourceRegistryEntrySchema.safeParse({
      schemaVersion,
      id: 'source-1',
      name: 'Restricted source',
      kind: 'FEED',
      baseUrl: 'https://example.com/feed',
      enabled: true,
      priority: 10,
      rights: 'PROHIBITED',
      connectorKey: 'rss',
      editorialNotes: null,
      createdAt: '2026-07-21T00:00:00.000Z',
      updatedAt: '2026-07-21T00:00:00.000Z',
    })
    expect(result.success).toBe(false)
  })

  it('rejects supported material claims without evidence', () => {
    expect(() =>
      ClaimSchema.parse({
        schemaVersion,
        id: 'claim-1',
        reportId: 'report-1',
        text: 'Material claim',
        kind: 'AUTHOR_CLAIM',
        material: true,
        supportStatus: 'SUPPORTED',
        evidenceSpanIds: [],
      }),
    ).toThrow(/requires evidence/)
  })

  it('keeps evidence boxes inside normalized page bounds', () => {
    expect(() =>
      NormalizedBoxSchema.parse({ x: 0.8, y: 0.1, width: 0.3, height: 0.2 }),
    ).toThrow(/page bounds/)
  })

  it('rejects visual edges that reference unknown nodes', () => {
    const result = VisualSpecSchema.safeParse({
      schemaVersion,
      id: 'visual-1',
      title: 'Mechanism',
      purpose: 'Explain information flow',
      nodes: [
        {
          id: 'node-1',
          label: 'Input',
          kind: 'INPUT',
          value: null,
          unit: null,
        },
      ],
      edges: [
        {
          id: 'edge-1',
          from: 'node-1',
          to: 'missing',
          label: null,
          kind: 'FLOW',
        },
      ],
      claimIds: [],
      evidenceSpanIds: [],
      layout: 'LEFT_TO_RIGHT',
    })
    expect(result.success).toBe(false)
  })

  it('fails publication closed when approval and evidence are missing', () => {
    const input = {
      report: {
        schemaVersion,
        id: 'report-1',
        paperVersionId: 'version-1',
        slug: 'paper-one',
        status: 'DRAFT',
        readingTimeMinutes: 8,
        sectionIds: ['section-1'],
        claimIds: ['claim-1'],
        conceptIds: [],
        visualIds: [],
        createdAt: '2026-07-21T00:00:00.000Z',
        updatedAt: '2026-07-21T00:00:00.000Z',
        editorApproval: null,
      },
      paperVersion: {
        schemaVersion,
        id: 'version-1',
        paperId: 'paper-1',
        versionLabel: 'v1',
        checksumSha256: 'a'.repeat(64),
        licenceStatus: 'PUBLIC',
        publicationDate: '2026-07-20',
        revisionDate: '2026-07-20',
        pageCount: 10,
        assetReference: null,
      },
      claims: [
        {
          schemaVersion,
          id: 'claim-1',
          reportId: 'report-1',
          text: 'Unsupported claim',
          kind: 'AUTHOR_CLAIM',
          material: true,
          supportStatus: 'INSUFFICIENT_EVIDENCE',
          evidenceSpanIds: [],
        },
      ],
      evidenceSpans: [],
      visuals: [],
      marketMetrics: [],
      integrityReview: {
        pageMappingsValidated: false,
        definitionsValidated: false,
        claimKindsDistinct: true,
        visualsValidated: true,
      },
    } satisfies PublicationInput

    expect(publicationBlockers(input).map((blocker) => blocker.code)).toEqual(
      expect.arrayContaining([
        'MATERIAL_CLAIM_WITHOUT_EVIDENCE',
        'INTEGRITY_REVIEW_INCOMPLETE',
        'REPORT_NOT_EDITOR_APPROVED',
      ]),
    )
  })
})
