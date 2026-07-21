import { describe, expect, it, vi } from 'vitest'

import { schemaVersion } from '@glyph/domain'
import type {
  ClassificationOutput,
  EditorialPackageOutput,
  EvidenceExtractionOutput,
  IntegrityReviewOutput,
  SourceDocument,
} from '@glyph/domain/runtime-agents'

import {
  MapConnectorRegistry,
  RuntimePublicationService,
  RuntimeWorkflowService,
  SourceTrackerService,
  type AgentInvocation,
  type RuntimeAgentSuite,
} from '@glyph/application'

import { InMemoryGlyphRepository } from './index.js'

const now = '2026-07-21T12:00:00.000Z'

describe('SourceTrackerService', () => {
  it('never polls disabled or prohibited sources', async () => {
    const repository = new InMemoryGlyphRepository()
    await repository.saveSource(
      source('disabled', false, 'PUBLIC_REUSE_ALLOWED'),
    )
    await repository.saveSource(source('prohibited', false, 'PROHIBITED'))
    const poll = vi.fn().mockResolvedValue([])
    const tracker = new SourceTrackerService(
      repository,
      new MapConnectorRegistry(new Map([['test', { poll }]])),
      () => now,
      (prefix) => `${prefix}-1`,
    )

    const scan = await tracker.scan({ trigger: 'SCHEDULED' })

    expect(poll).not.toHaveBeenCalled()
    expect(scan.excluded).toBe(2)
  })

  it('deduplicates the same version and preserves a revised version', async () => {
    const repository = new InMemoryGlyphRepository()
    await repository.saveSource(source('active', true, 'PUBLIC_REUSE_ALLOWED'))
    let documents = [paperDocument('a')]
    const tracker = new SourceTrackerService(
      repository,
      new MapConnectorRegistry(
        new Map([['test', { poll: () => Promise.resolve(documents) }]]),
      ),
      () => now,
      (() => {
        let id = 0
        return (prefix: string) => `${prefix}-${++id}`
      })(),
    )

    const first = await tracker.scan({ trigger: 'MANUAL' })
    const duplicate = await tracker.scan({ trigger: 'MANUAL' })
    documents = [paperDocument('b')]
    const revised = await tracker.scan({ trigger: 'MANUAL' })

    expect(first.ingested).toBe(1)
    expect(duplicate.duplicates).toBe(1)
    expect(revised.ingested).toBe(1)
    const v1 = await repository.findIngestedDocument(`PAPER:${'a'.repeat(64)}`)
    const v2 = await repository.findIngestedDocument(`PAPER:${'b'.repeat(64)}`)
    expect(v1?.paperId).toBe(v2?.paperId)
    expect(v1?.paperVersionId).not.toBe(v2?.paperVersionId)
  })

  it('deduplicates overlapping scheduled and manual scans atomically', async () => {
    const repository = new InMemoryGlyphRepository()
    await repository.saveSource(source('active', true, 'PUBLIC_REUSE_ALLOWED'))
    const tracker = new SourceTrackerService(
      repository,
      new MapConnectorRegistry(
        new Map([
          ['test', { poll: () => Promise.resolve([paperDocument('d')]) }],
        ]),
      ),
      () => now,
    )

    const scans = await Promise.all([
      tracker.scan({ trigger: 'SCHEDULED' }),
      tracker.scan({ trigger: 'MANUAL' }),
    ])

    expect(scans.reduce((sum, scan) => sum + scan.ingested, 0)).toBe(1)
    expect(scans.reduce((sum, scan) => sum + scan.duplicates, 0)).toBe(1)
  })

  it('records connector failure without returning success-shaped data', async () => {
    const repository = new InMemoryGlyphRepository()
    await repository.saveSource(source('active', true, 'PUBLIC_REUSE_ALLOWED'))
    const tracker = new SourceTrackerService(
      repository,
      new MapConnectorRegistry(
        new Map([
          [
            'test',
            { poll: () => Promise.reject(new Error('feed unavailable')) },
          ],
        ]),
      ),
      () => now,
    )

    const scan = await tracker.scan({ trigger: 'SCHEDULED' })

    expect(scan.status).toBe('FAILED')
    expect(scan.errors).toEqual([
      { sourceId: 'source-active', message: 'feed unavailable' },
    ])
  })
})

describe('RuntimeWorkflowService', () => {
  it('enforces both human gates around a complete eight-agent workflow', async () => {
    const repository = new InMemoryGlyphRepository()
    await repository.saveSource(source('active', true, 'PUBLIC_REUSE_ALLOWED'))
    const tracker = new SourceTrackerService(
      repository,
      new MapConnectorRegistry(
        new Map([
          [
            'test',
            {
              poll: () =>
                Promise.resolve([
                  paperDocument('a', 'paper-a'),
                  paperDocument('b', 'paper-b'),
                  paperDocument('c', 'paper-c'),
                ]),
            },
          ],
        ]),
      ),
      () => now,
    )
    await tracker.scan({ trigger: 'MANUAL' })
    const versions = await Promise.all(
      ['a', 'b', 'c'].map(
        async (letter) =>
          (await repository.findIngestedDocument(`PAPER:${letter.repeat(64)}`))
            ?.paperVersionId,
      ),
    )
    const paperVersionIds = versions.filter(
      (value): value is string => value !== null && value !== undefined,
    )
    const service = new RuntimeWorkflowService(
      repository,
      fakeAgents(),
      () => now,
    )
    await repository.savePaperLabelOntology({
      id: 'paper-label-ontology.v1',
      version: 1,
      status: 'ACTIVE',
      rules: [
        {
          id: 'relevance',
          kind: 'SEMANTIC',
          label: 'Relevant',
          description: 'Relevant to the approved scope',
          weight: 1,
          examples: ['Example'],
        },
      ],
      acceptanceThreshold: 0.7,
      reviewBand: 0.05,
      approvedAt: now,
      approvedBy: 'editor-1',
    })
    const workflow = await service.start({
      paperVersionIds,
      ontologyId: 'paper-label-ontology.v1',
    })

    expect(workflow.status).toBe('AWAITING_SELECTION')
    await expect(
      service.processSelected({
        workflowId: workflow.id,
        approvedMarketData: [],
      }),
    ).rejects.toMatchObject({ code: 'WORKFLOW_NOT_PROCESSABLE' })

    const selectedId = workflow.shortlist?.candidates[0]?.paperVersionId
    if (selectedId === undefined) throw new Error('Expected shortlist')
    await service.select({
      workflowId: workflow.id,
      paperVersionId: selectedId,
      editorId: 'editor-1',
    })
    const processed = await service.processSelected({
      workflowId: workflow.id,
      approvedMarketData: [],
    })
    expect(processed.status).toBe('AWAITING_PUBLICATION_APPROVAL')
    expect(await repository.listAgentRuns(workflow.id)).toHaveLength(10)

    const packageId = processed.editorialPackageId
    if (packageId === null) throw new Error('Expected editorial package')
    const publication = new RuntimePublicationService(repository, () => now)
    await expect(publication.publish(packageId)).rejects.toMatchObject({
      code: 'PACKAGE_NOT_APPROVED',
    })
    const approved = await publication.approve(packageId, 'editor-2')
    const published = await publication.publish(packageId)
    expect(approved.status).toBe('APPROVED')
    expect(published.status).toBe('PUBLISHED')
    expect((await repository.getRuntimeWorkflow(workflow.id))?.status).toBe(
      'PUBLISHED',
    )
  })
})

function source(
  id: string,
  enabled: boolean,
  rights: 'PUBLIC_REUSE_ALLOWED' | 'PROHIBITED',
) {
  return {
    schemaVersion,
    id: `source-${id}`,
    name: id,
    kind: 'LAB' as const,
    baseUrl: `https://example.com/${id}`,
    enabled,
    priority: 80,
    rights,
    connectorKey: 'test',
    editorialNotes: null,
    createdAt: now,
    updatedAt: now,
  }
}

function paperDocument(letter: string, externalId = 'paper'): SourceDocument {
  return {
    sourceId: 'source-active',
    externalId,
    documentType: 'PAPER',
    title: `Paper ${letter}`,
    abstract: 'A relevant paper abstract',
    authors: ['Researcher'],
    canonicalUrl: `https://example.com/${externalId}`,
    doi: `10.0000/${externalId}`,
    publicationDate: '2026-07-20',
    revisionDate: `2026-07-${letter === 'a' ? '20' : '21'}`,
    licenceStatus: 'PUBLIC',
    contentSha256: letter.repeat(64),
    assetReference: `s3://${externalId}.pdf`,
    pages: [
      {
        pageNumber: 1,
        text: 'The system routes requests.',
        segments: [
          {
            id: 'segment-1',
            exactText: 'The system routes requests.',
            boxes: [{ x: 0, y: 0, width: 0.5, height: 0.1 }],
          },
        ],
      },
    ],
    pageCount: 1,
  }
}

function fakeAgents(): RuntimeAgentSuite {
  const classification: ClassificationOutput = {
    ontologyId: 'paper-label-ontology.v1',
    labels: ['AI'],
    mechanismLabels: ['routing'],
    difficulty: 'ADVANCED',
    ruleResults: [
      { ruleId: 'relevance', matched: true, score: 0.9, rationale: 'Relevant' },
    ],
    scores: {
      relevance: 0.9,
      novelty: 0.8,
      importance: 0.8,
      evidenceQuality: 0.8,
      overall: 0.85,
    },
    confidence: 0.9,
    rationale: 'Relevant paper',
    decision: 'ACCEPT',
  }
  const evidence: EvidenceExtractionOutput = {
    evidenceSpans: [
      {
        schemaVersion,
        id: 'span-1',
        paperVersionId: 'replaced-at-runtime',
        pageNumber: 1,
        sectionTitle: 'Abstract',
        text: 'The system routes requests.',
        boundingBoxes: [{ x: 0, y: 0, width: 0.5, height: 0.1 }],
      },
    ],
    claims: [
      {
        id: 'claim-1',
        text: 'The system routes requests.',
        kind: 'PAPER_FACT',
        material: true,
        supportStatus: 'SUPPORTED',
        evidenceSpanIds: ['span-1'],
        limitation: 'No production economics are established.',
      },
    ],
    limitations: ['No production deployment'],
    contradictions: [],
  }
  const integrity: IntegrityReviewOutput = {
    passed: true,
    blockers: [],
    warnings: [],
    coverage: {
      materialClaims: 1,
      supportedMaterialClaims: 1,
      evidenceReferencesChecked: 1,
      conceptsChecked: 1,
      marketClaimsChecked: 0,
    },
  }
  const editorial: EditorialPackageOutput = {
    headline: 'A relevant paper',
    reviewSummary: 'Evidence-backed and ready for editor review.',
    newsletterBullets: ['One', 'Two', 'Three', 'Four', 'Five'],
    socialPosts: ['A sourced paper summary.'],
  }
  const result = <T>(output: T): Promise<AgentInvocation<T>> =>
    Promise.resolve({
      responseId: 'resp-test',
      model: 'test-model',
      output,
      warnings: [],
      attempts: 1,
    })
  return {
    classify: () => result(classification),
    rank: (input) =>
      result({
        candidates: input.candidates.slice(0, 4).map((candidate, index) => ({
          paperVersionId: candidate.paperVersionId,
          rank: index + 1,
          score: 0.9 - index * 0.1,
          rationale: 'Ranked by approved criteria',
          diversityContribution: 'Distinct mechanism',
        })),
        selectionNote: 'An editor must select one paper.',
      }),
    extractEvidence: (input) =>
      result({
        ...evidence,
        evidenceSpans: evidence.evidenceSpans.map((span) => ({
          ...span,
          paperVersionId: input.paperVersion.id,
        })),
      }),
    summarize: () =>
      result({
        title: 'Summary',
        readingTimeMinutes: 5,
        sections: [
          {
            kind: 'EXECUTIVE_SUMMARY',
            depth: 'FIVE_MINUTES',
            order: 0,
            blocks: [
              {
                id: 'block-1',
                heading: null,
                body: 'The system routes requests.',
                claimIds: ['claim-1'],
                evidenceSpanIds: ['span-1'],
              },
            ],
          },
        ],
        openQuestions: ['Does it scale?'],
      }),
    mapConcepts: () =>
      result({
        concepts: [
          {
            id: 'concept-1',
            name: 'Routing',
            shortDefinition: 'Selecting a path',
            contextualExplanation: 'Requests are assigned to a path.',
            relevance: 'Core mechanism',
            analogy: null,
            canonicalSource: null,
            relatedConceptIds: [],
          },
        ],
        occurrences: [
          {
            conceptId: 'concept-1',
            evidenceSpanId: 'span-1',
            explanation: 'Named mechanism',
          },
        ],
      }),
    analyzeMarket: () => result({ claims: [], causalChain: [] }),
    reviewIntegrity: () => result(integrity),
    packageEditorial: () => result(editorial),
  }
}
