import { describe, expect, it } from 'vitest'
import {
  schemaVersion,
  type ConceptCard,
  type Paper,
  type PaperVersion,
} from '@glyph/domain'
import {
  FixtureCitedQuestionService,
  GenerateIllustrationDraftService,
  InMemoryConceptRepository,
  InMemoryPaperRepository,
  InMemoryReportRepository,
  type IllustrationGenerationGateway,
} from './index'

describe('FixtureCitedQuestionService', () => {
  const supportedAnswer = {
    schemaVersion,
    id: 'answer-supported',
    reportId: 'report-1',
    question: 'What is supported?',
    outcome: 'ANSWER' as const,
    answerText: 'Only this evidence-linked statement is supported.',
    evidenceSpanIds: ['evidence-1'],
    generatedAt: '2026-07-21T00:00:00.000Z',
    validatedAt: '2026-07-21T00:00:00.000Z',
  }
  const evidence = {
    schemaVersion,
    id: 'evidence-1',
    paperVersionId: 'version-1',
    pageNumber: 1,
    section: 'Fixture',
    exactText: 'Only this evidence-linked statement is supported.',
    boxes: [{ x: 0.1, y: 0.1, width: 0.5, height: 0.1 }],
  }

  it('returns a corpus answer only when all cited evidence exists', async () => {
    const service = new FixtureCitedQuestionService(
      [supportedAnswer],
      [evidence],
    )
    await expect(
      service.answerQuestion('report-1', '  WHAT IS SUPPORTED? '),
    ).resolves.toEqual(supportedAnswer)
  })

  it('fails closed for an unsupported question or missing citation', async () => {
    const service = new FixtureCitedQuestionService([supportedAnswer], [])
    const missingCitation = await service.answerQuestion(
      'report-1',
      'What is supported?',
    )
    const unsupported = await service.answerQuestion(
      'report-1',
      'Which company should I buy?',
    )
    expect(missingCitation.outcome).toBe('INSUFFICIENT_EVIDENCE')
    expect(missingCitation.answerText).toBeNull()
    expect(missingCitation.evidenceSpanIds).toEqual([])
    expect(unsupported.outcome).toBe('INSUFFICIENT_EVIDENCE')
    expect(unsupported.answerText).toBeNull()
  })
})

const concept: ConceptCard = {
  schemaVersion,
  id: 'concept-1',
  name: 'Synthetic concept',
  shortDefinition: 'A fixture concept.',
  contextualExplanation: 'Used to test save behavior.',
  relevance: 'Demonstrates the learning library.',
  analogy: null,
  visualSpecId: null,
  canonicalSource: null,
  relatedConceptIds: [],
}

describe('InMemoryConceptRepository', () => {
  it('saves and removes a concept for one user', async () => {
    const repository = new InMemoryConceptRepository([concept])
    await repository.save('user-1', concept.id)
    await expect(repository.listSaved('user-1')).resolves.toEqual([concept])

    await repository.unsave('user-1', concept.id)
    await expect(repository.listSaved('user-1')).resolves.toEqual([])
  })

  it('rejects an unknown concept', async () => {
    const repository = new InMemoryConceptRepository([])
    await expect(repository.save('user-1', 'missing')).rejects.toThrow(
      'Unknown concept',
    )
  })
})

describe('in-memory paper and report repositories', () => {
  const paper: Paper = {
    schemaVersion,
    id: 'paper-1',
    title: 'Synthetic paper',
    authors: ['Glyph'],
    lab: 'Glyph Synthetic Lab',
    canonicalUrl: null,
    sourceType: 'SYNTHETIC_DEMO',
    topicLabels: ['Testing'],
    mechanismLabels: ['Fixtures'],
    difficulty: 'FOUNDATIONAL',
    selectionRationale: 'Repository test.',
    syntheticDisclosure: 'Synthetic test record.',
  }
  const version: PaperVersion = {
    schemaVersion,
    id: 'version-1',
    paperId: paper.id,
    versionLabel: 'v1',
    checksumSha256: 'a'.repeat(64),
    licenceStatus: 'SYNTHETIC',
    publicationDate: '2026-07-21',
    revisionDate: '2026-07-21',
    pageCount: 1,
    assetPath: '/demo.pdf',
  }

  it('returns paper records and explicit nulls for missing IDs', async () => {
    const repository = new InMemoryPaperRepository([paper], [version])
    await expect(repository.getPaper(paper.id)).resolves.toEqual(paper)
    await expect(repository.getVersion(version.id)).resolves.toEqual(version)
    await expect(repository.getPaper('missing')).resolves.toBeNull()
  })

  it('looks up complete editions by slug without fallback', async () => {
    const edition = {
      paper,
      version,
      report: {
        schemaVersion,
        id: 'report-1',
        paperVersionId: version.id,
        slug: 'synthetic-report',
        status: 'READY_FOR_EDITOR' as const,
        readingTimeMinutes: 5,
        sectionIds: ['section-1'],
        claimIds: ['claim-1'],
        conceptIds: [],
        visualIds: [],
        createdAt: '2026-07-21T00:00:00.000Z',
        updatedAt: '2026-07-21T00:00:00.000Z',
        editorApproval: null,
      },
      sections: [],
      claims: [],
      evidenceSpans: [],
      concepts: [],
      visuals: [],
    }
    const repository = new InMemoryReportRepository([edition])
    await expect(
      repository.getEditionBySlug(edition.report.slug),
    ).resolves.toEqual(edition)
    await expect(repository.getEditionBySlug('missing')).resolves.toBeNull()
  })
})

describe('GenerateIllustrationDraftService', () => {
  const pendingDraft = {
    paperVersionId: 'version-1',
    purpose: 'VISUAL_ABSTRACT' as const,
    model: 'test-image-model',
    promptVersion: 'test-prompt-v1',
    generatedAt: '2026-07-21T00:00:00.000Z',
    mimeType: 'image/png' as const,
    imageBase64: 'c3ludGhldGljLWltYWdl',
    reviewStatus: 'PENDING_HUMAN_REVIEW' as const,
    semanticUseAllowed: false as const,
  }

  it('requires an explicit editor confirmation before generation', async () => {
    const gateway: IllustrationGenerationGateway = {
      generateDraft: () => Promise.resolve(pendingDraft),
    }
    await expect(
      new GenerateIllustrationDraftService(gateway).execute({
        paperVersionId: 'version-1',
        purpose: 'VISUAL_ABSTRACT',
        brief: 'A calm abstract field of layered violet light.',
        editorConfirmedNonSemanticUse: false,
      }),
    ).rejects.toThrow('ILLUSTRATION_GENERATION_REQUIRES_EDITOR_CONFIRMATION')
  })

  it('normalizes a valid brief and preserves pending human review', async () => {
    let receivedBrief = ''
    const gateway: IllustrationGenerationGateway = {
      generateDraft: (input) => {
        receivedBrief = input.brief
        return Promise.resolve(pendingDraft)
      },
    }
    await expect(
      new GenerateIllustrationDraftService(gateway).execute({
        paperVersionId: 'version-1',
        purpose: 'VISUAL_ABSTRACT',
        brief: '  A calm abstract field of layered violet light.  ',
        editorConfirmedNonSemanticUse: true,
      }),
    ).resolves.toEqual(pendingDraft)
    expect(receivedBrief).toBe('A calm abstract field of layered violet light.')
  })

  it('rejects a gateway response that bypasses human review', async () => {
    const gateway: IllustrationGenerationGateway = {
      generateDraft: () =>
        Promise.resolve({
          ...pendingDraft,
          reviewStatus: 'APPROVED_FOR_DECORATIVE_USE',
          semanticUseAllowed: true,
        } as unknown as typeof pendingDraft),
    }
    await expect(
      new GenerateIllustrationDraftService(gateway).execute({
        paperVersionId: 'version-1',
        purpose: 'VISUAL_ABSTRACT',
        brief: 'A calm abstract field of layered violet light.',
        editorConfirmedNonSemanticUse: true,
      }),
    ).rejects.toThrow('ILLUSTRATION_REVIEW_BOUNDARY_VIOLATED')
  })
})
