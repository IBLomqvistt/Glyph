import { createHash } from 'node:crypto'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import {
  ClaimSchema,
  ConceptCardSchema,
  EvidenceSpanSchema,
  NewsletterSchema,
  PaperSchema,
  PaperVersionSchema,
  QuestionAnswerSchema,
  ReportSchema,
  ReportSectionSchema,
  VisualSpecSchema,
  schemaVersion,
  type Claim,
  type ConceptCard,
  type EvidenceSpan,
  type Newsletter,
  type Paper,
  type PaperVersion,
  type QuestionAnswer,
  type Report,
  type ReportSection,
  type VisualSpec,
} from '../../packages/domain/src/index'

export const syntheticDisclosure =
  'Synthetic Glyph demonstration — not a real paper or investment analysis.'

export const pageSize = { width: 612, height: 792 } as const
const bodyX = 72
const bodySize = 11

type EvidenceLine = {
  id: string
  pageNumber: number
  section: string
  y: number
  text: string
}

export const evidenceLines: readonly EvidenceLine[] = [
  {
    id: 'evidence-decompose',
    pageNumber: 1,
    section: 'Abstract',
    y: 600,
    text: 'The system decomposes a complex request into independent work packets.',
  },
  {
    id: 'evidence-concurrency',
    pageNumber: 1,
    section: 'Abstract',
    y: 568,
    text: 'Four workers execute packets concurrently before a verified merge.',
  },
  {
    id: 'evidence-delay',
    pageNumber: 1,
    section: 'Synthetic measurement',
    y: 486,
    text: 'Sequential delay is 90 synthetic ms; parallel delay is 20 synthetic ms.',
  },
  {
    id: 'evidence-cache',
    pageNumber: 2,
    section: 'Mechanism',
    y: 610,
    text: 'Each worker reads a shared cache but writes only to its assigned partition.',
  },
  {
    id: 'evidence-retry',
    pageNumber: 2,
    section: 'Failure behavior',
    y: 530,
    text: 'Failed packets are retried once, then surfaced without a plausible fallback.',
  },
  {
    id: 'evidence-weights',
    pageNumber: 2,
    section: 'Scope',
    y: 450,
    text: 'Parallel execution changes scheduling in this demo, not model weights.',
  },
  {
    id: 'evidence-no-market',
    pageNumber: 3,
    section: 'Limitations',
    y: 610,
    text: 'This synthetic study does not measure production cost or market demand.',
  },
  {
    id: 'evidence-no-trade',
    pageNumber: 3,
    section: 'Limitations',
    y: 578,
    text: 'No company, security, or trade is evaluated in this demonstration.',
  },
  {
    id: 'evidence-baseline',
    pageNumber: 3,
    section: 'Baseline',
    y: 482,
    text: 'A sequential baseline completes nine synthetic steps before aggregation.',
  },
] as const

function evidenceSpan(line: EvidenceLine, width: number): EvidenceSpan {
  return EvidenceSpanSchema.parse({
    schemaVersion,
    id: line.id,
    paperVersionId: 'glyph-agent-swarm-demo-v1',
    pageNumber: line.pageNumber,
    section: line.section,
    exactText: line.text,
    boxes: [
      {
        x: bodyX / pageSize.width,
        y: (pageSize.height - line.y - bodySize) / pageSize.height,
        width: width / pageSize.width,
        height: (bodySize * 1.35) / pageSize.height,
      },
    ],
  })
}

export async function buildSyntheticPdf(): Promise<{
  bytes: Uint8Array
  evidenceSpans: EvidenceSpan[]
  checksumSha256: string
}> {
  const pdf = await PDFDocument.create()
  pdf.setTitle('Glyph Agent Swarm Demonstration')
  pdf.setAuthor('Glyph synthetic fixture generator')
  pdf.setSubject(syntheticDisclosure)
  const fixedDate = new Date('2026-07-21T00:00:00.000Z')
  pdf.setCreationDate(fixedDate)
  pdf.setModificationDate(fixedDate)
  const serif = await pdf.embedFont(StandardFonts.TimesRoman)
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold)
  const sans = await pdf.embedFont(StandardFonts.Helvetica)

  for (let pageNumber = 1; pageNumber <= 3; pageNumber += 1) {
    const page = pdf.addPage([pageSize.width, pageSize.height])
    page.drawText('GLYPH / SYNTHETIC DEMONSTRATION', {
      x: bodyX,
      y: 742,
      size: 9,
      font: sans,
      color: rgb(0.37, 0.32, 0.82),
    })
    page.drawText(
      pageNumber === 1
        ? 'Agent Swarm: A Synthetic Study of Parallel Work'
        : pageNumber === 2
          ? '2. Mechanism and Failure Behavior'
          : '3. Limitations and Baseline',
      { x: bodyX, y: 690, size: pageNumber === 1 ? 22 : 18, font: serifBold },
    )
    page.drawText(syntheticDisclosure, {
      x: bodyX,
      y: 654,
      size: 9,
      font: sans,
      color: rgb(0.42, 0.45, 0.56),
    })

    for (const line of evidenceLines.filter(
      (candidate) => candidate.pageNumber === pageNumber,
    )) {
      page.drawText(line.section.toUpperCase(), {
        x: bodyX,
        y: line.y + 22,
        size: 8,
        font: sans,
        color: rgb(0.37, 0.32, 0.82),
      })
      page.drawText(line.text, {
        x: bodyX,
        y: line.y,
        size: bodySize,
        font: serif,
        color: rgb(0.08, 0.11, 0.23),
      })
    }

    page.drawText(`${pageNumber} / 3`, {
      x: 500,
      y: 36,
      size: 9,
      font: sans,
      color: rgb(0.42, 0.45, 0.56),
    })
  }

  const evidenceSpans = evidenceLines.map((line) =>
    evidenceSpan(line, serif.widthOfTextAtSize(line.text, bodySize)),
  )
  const bytes = await pdf.save({ useObjectStreams: false })
  return {
    bytes,
    evidenceSpans,
    checksumSha256: createHash('sha256').update(bytes).digest('hex'),
  }
}

function makeClaim(input: Omit<Claim, 'schemaVersion' | 'reportId'>): Claim {
  return ClaimSchema.parse({
    schemaVersion,
    reportId: 'report-agent-swarm-demo',
    ...input,
  })
}

function makeConcept(input: Omit<ConceptCard, 'schemaVersion'>): ConceptCard {
  return ConceptCardSchema.parse({ schemaVersion, ...input })
}

function makeVisual(input: Omit<VisualSpec, 'schemaVersion'>): VisualSpec {
  return VisualSpecSchema.parse({ schemaVersion, ...input })
}

export type SyntheticEdition = {
  disclosure: string
  paper: Paper
  version: PaperVersion
  report: Report
  sections: ReportSection[]
  claims: Claim[]
  evidenceSpans: EvidenceSpan[]
  concepts: ConceptCard[]
  visuals: VisualSpec[]
  newsletter: Newsletter
  socialPreview: {
    hook: string
    observations: [string, string, string]
    sourcePath: string
    reportPath: string
    disclaimer: string
  }
  answers: QuestionAnswer[]
}

export async function buildSyntheticEdition(): Promise<SyntheticEdition> {
  const { evidenceSpans, checksumSha256 } = await buildSyntheticPdf()

  const paper = PaperSchema.parse({
    schemaVersion,
    id: 'paper-agent-swarm-demo',
    title: 'Agent Swarm: A Synthetic Study of Parallel Work',
    authors: ['Glyph Fixture Team'],
    lab: 'Glyph Synthetic Lab',
    canonicalUrl: null,
    sourceType: 'SYNTHETIC_DEMO',
    topicLabels: ['Agent systems', 'Learning systems'],
    mechanismLabels: ['Parallel orchestration', 'Shared cache'],
    difficulty: 'INTERMEDIATE',
    selectionRationale:
      'Selected to demonstrate evidence-linked teaching without representing a real paper.',
    syntheticDisclosure,
  })

  const version = PaperVersionSchema.parse({
    schemaVersion,
    id: 'glyph-agent-swarm-demo-v1',
    paperId: paper.id,
    versionLabel: 'synthetic-v1',
    checksumSha256,
    licenceStatus: 'SYNTHETIC',
    publicationDate: '2026-07-21',
    revisionDate: '2026-07-21',
    pageCount: 3,
    assetPath: '/demo/glyph-agent-swarm-demo.pdf',
  })

  const claims = [
    makeClaim({
      id: 'claim-decomposition',
      text: 'The synthetic system decomposes one request into independent work packets.',
      kind: 'PAPER_FACT',
      material: true,
      supportStatus: 'SUPPORTED',
      evidenceSpanIds: ['evidence-decompose'],
    }),
    makeClaim({
      id: 'claim-concurrency',
      text: 'The fixture authors describe four concurrent workers and a verified merge.',
      kind: 'AUTHOR_CLAIM',
      material: true,
      supportStatus: 'SUPPORTED',
      evidenceSpanIds: ['evidence-concurrency'],
    }),
    makeClaim({
      id: 'claim-delay-calculation',
      text: 'Glyph calculates a 4.5× synthetic delay ratio from 90 ms divided by 20 ms.',
      kind: 'GLYPH_CALCULATION',
      material: true,
      supportStatus: 'SUPPORTED',
      evidenceSpanIds: ['evidence-delay'],
    }),
    makeClaim({
      id: 'claim-scheduling-interpretation',
      text: 'Glyph interprets the change as orchestration behavior, not a change to model weights.',
      kind: 'GLYPH_INTERPRETATION',
      material: true,
      supportStatus: 'SUPPORTED',
      evidenceSpanIds: ['evidence-weights'],
    }),
    makeClaim({
      id: 'claim-no-trade',
      text: 'No direct trade implication can be supported by this synthetic demonstration.',
      kind: 'INVESTMENT_HYPOTHESIS',
      material: true,
      supportStatus: 'SUPPORTED',
      evidenceSpanIds: ['evidence-no-market', 'evidence-no-trade'],
    }),
    makeClaim({
      id: 'claim-cache',
      text: 'Workers share reads while writes remain partitioned.',
      kind: 'PAPER_FACT',
      material: true,
      supportStatus: 'SUPPORTED',
      evidenceSpanIds: ['evidence-cache'],
    }),
    makeClaim({
      id: 'claim-retry',
      text: 'The fixture surfaces failed packets after one retry.',
      kind: 'AUTHOR_CLAIM',
      material: true,
      supportStatus: 'SUPPORTED',
      evidenceSpanIds: ['evidence-retry'],
    }),
    makeClaim({
      id: 'claim-baseline',
      text: 'The baseline contains nine synthetic steps before aggregation.',
      kind: 'PAPER_FACT',
      material: false,
      supportStatus: 'SUPPORTED',
      evidenceSpanIds: ['evidence-baseline'],
    }),
    makeClaim({
      id: 'claim-cost-savings',
      text: 'The demonstration establishes production cost savings.',
      kind: 'INVESTMENT_HYPOTHESIS',
      material: false,
      supportStatus: 'INSUFFICIENT_EVIDENCE',
      evidenceSpanIds: [],
    }),
    makeClaim({
      id: 'claim-weights-contradicted',
      text: 'Workers modify the underlying model weights.',
      kind: 'AUTHOR_CLAIM',
      material: false,
      supportStatus: 'CONTRADICTED',
      evidenceSpanIds: ['evidence-weights'],
    }),
  ]

  const concepts = [
    makeConcept({
      id: 'concept-work-packet',
      name: 'Work packet',
      shortDefinition: 'A bounded unit of work with an explicit result.',
      contextualExplanation:
        'In this fixture, one request is split into independent packets before execution.',
      relevance:
        'Boundaries determine which work can safely proceed in parallel.',
      analogy:
        'Like assigning separate chapters to editors before one final review.',
      visualSpecId: 'visual-work-packet',
      canonicalSource: null,
      relatedConceptIds: ['concept-idempotency'],
    }),
    makeConcept({
      id: 'concept-shared-cache',
      name: 'Shared cache',
      shortDefinition: 'A store that several workers can read from.',
      contextualExplanation:
        'The demo uses shared reads and partitioned writes to keep worker effects separate.',
      relevance:
        'Coordination rules affect correctness as much as concurrency.',
      analogy:
        'A common reference shelf with a separate notebook for each researcher.',
      visualSpecId: 'visual-shared-cache',
      canonicalSource: null,
      relatedConceptIds: ['concept-kv-cache'],
    }),
    makeConcept({
      id: 'concept-kv-cache',
      name: 'KV cache',
      shortDefinition:
        'Stored key and value representations reused during token generation.',
      contextualExplanation:
        'This is a teaching comparison, not a mechanism claimed by the synthetic paper.',
      relevance:
        'It shows how reuse can reduce repeated computation while increasing stored state.',
      analogy:
        'Keeping indexed notes beside you instead of rereading every source page.',
      visualSpecId: 'visual-shared-cache',
      canonicalSource: null,
      relatedConceptIds: ['concept-mla'],
    }),
    makeConcept({
      id: 'concept-mla',
      name: 'Multi-head latent attention',
      shortDefinition:
        'An attention design that compresses cached representations.',
      contextualExplanation:
        'Included only as a contextual teaching example for cache trade-offs.',
      relevance:
        'It helps distinguish orchestration concurrency from model-architecture efficiency.',
      analogy:
        'A compact index that can reconstruct several views of the same notes.',
      visualSpecId: null,
      canonicalSource: null,
      relatedConceptIds: ['concept-kv-cache'],
    }),
    makeConcept({
      id: 'concept-idempotency',
      name: 'Idempotency',
      shortDefinition:
        'Repeating the same operation does not duplicate its effect.',
      contextualExplanation:
        'Each demo pipeline stage has a stable key so safe retries reuse completed work.',
      relevance:
        'Long-running analysis must recover without duplicating reports or distribution.',
      analogy: 'A stamped ticket that cannot be counted twice.',
      visualSpecId: null,
      canonicalSource: null,
      relatedConceptIds: ['concept-work-packet'],
    }),
  ]

  const visuals = [
    makeVisual({
      id: 'visual-hero',
      title: 'Sequential baseline and parallel proposal',
      purpose: 'Compare the exact synthetic execution structures.',
      nodes: [
        {
          id: 'base-input',
          label: 'Request',
          kind: 'INPUT',
          value: null,
          unit: null,
        },
        {
          id: 'base-steps',
          label: '9 sequential steps',
          kind: 'PROCESS',
          value: 9,
          unit: 'steps',
        },
        {
          id: 'parallel-split',
          label: 'Split into packets',
          kind: 'PROCESS',
          value: null,
          unit: null,
        },
        {
          id: 'parallel-workers',
          label: '4 concurrent workers',
          kind: 'PROCESS',
          value: 4,
          unit: 'workers',
        },
        {
          id: 'verified-merge',
          label: 'Verified merge',
          kind: 'OUTPUT',
          value: null,
          unit: null,
        },
      ],
      edges: [
        {
          id: 'hero-edge-1',
          from: 'base-input',
          to: 'base-steps',
          label: 'baseline',
          kind: 'COMPARE',
        },
        {
          id: 'hero-edge-2',
          from: 'base-input',
          to: 'parallel-split',
          label: 'proposal',
          kind: 'FLOW',
        },
        {
          id: 'hero-edge-3',
          from: 'parallel-split',
          to: 'parallel-workers',
          label: null,
          kind: 'FLOW',
        },
        {
          id: 'hero-edge-4',
          from: 'parallel-workers',
          to: 'verified-merge',
          label: null,
          kind: 'FLOW',
        },
      ],
      groups: [
        {
          id: 'group-baseline',
          label: 'Sequential baseline',
          nodeIds: ['base-steps'],
        },
        {
          id: 'group-proposal',
          label: 'Parallel proposal',
          nodeIds: ['parallel-split', 'parallel-workers', 'verified-merge'],
        },
      ],
      claimIds: ['claim-concurrency', 'claim-baseline'],
      evidenceSpanIds: ['evidence-concurrency', 'evidence-baseline'],
      layout: 'BASELINE_COMPARE',
    }),
    makeVisual({
      id: 'visual-shared-cache',
      title: 'Shared reads and partitioned writes',
      purpose: 'Show information movement and stored state.',
      nodes: [
        {
          id: 'cache',
          label: 'Shared read cache',
          kind: 'STORE',
          value: null,
          unit: null,
        },
        {
          id: 'worker-a',
          label: 'Worker A',
          kind: 'PROCESS',
          value: null,
          unit: null,
        },
        {
          id: 'worker-b',
          label: 'Worker B',
          kind: 'PROCESS',
          value: null,
          unit: null,
        },
        {
          id: 'partition-a',
          label: 'Write partition A',
          kind: 'STORE',
          value: null,
          unit: null,
        },
        {
          id: 'partition-b',
          label: 'Write partition B',
          kind: 'STORE',
          value: null,
          unit: null,
        },
      ],
      edges: [
        {
          id: 'cache-a',
          from: 'cache',
          to: 'worker-a',
          label: 'read',
          kind: 'FLOW',
        },
        {
          id: 'cache-b',
          from: 'cache',
          to: 'worker-b',
          label: 'read',
          kind: 'FLOW',
        },
        {
          id: 'write-a',
          from: 'worker-a',
          to: 'partition-a',
          label: 'write',
          kind: 'STORE',
        },
        {
          id: 'write-b',
          from: 'worker-b',
          to: 'partition-b',
          label: 'write',
          kind: 'STORE',
        },
      ],
      groups: [],
      claimIds: ['claim-cache'],
      evidenceSpanIds: ['evidence-cache'],
      layout: 'LEFT_TO_RIGHT',
    }),
    makeVisual({
      id: 'visual-retry',
      title: 'Explicit retry and failure state',
      purpose: 'Show that missing results never receive a plausible fallback.',
      nodes: [
        {
          id: 'attempt',
          label: 'Packet attempt',
          kind: 'INPUT',
          value: null,
          unit: null,
        },
        {
          id: 'retry',
          label: 'One retry',
          kind: 'PROCESS',
          value: 1,
          unit: 'retry',
        },
        {
          id: 'failure',
          label: 'Surface failure',
          kind: 'OUTPUT',
          value: null,
          unit: null,
        },
      ],
      edges: [
        {
          id: 'retry-edge',
          from: 'attempt',
          to: 'retry',
          label: 'failed',
          kind: 'FLOW',
        },
        {
          id: 'failure-edge',
          from: 'retry',
          to: 'failure',
          label: 'failed again',
          kind: 'DISCARD',
        },
      ],
      groups: [],
      claimIds: ['claim-retry'],
      evidenceSpanIds: ['evidence-retry'],
      layout: 'LEFT_TO_RIGHT',
    }),
    makeVisual({
      id: 'visual-work-packet',
      title: 'One request, bounded packets',
      purpose: 'Explain the work-packet concept.',
      nodes: [
        {
          id: 'request',
          label: 'Request',
          kind: 'INPUT',
          value: null,
          unit: null,
        },
        {
          id: 'packet',
          label: 'Independent packet',
          kind: 'PROCESS',
          value: null,
          unit: null,
        },
        {
          id: 'result',
          label: 'Explicit result',
          kind: 'OUTPUT',
          value: null,
          unit: null,
        },
      ],
      edges: [
        {
          id: 'packet-edge',
          from: 'request',
          to: 'packet',
          label: 'decompose',
          kind: 'FLOW',
        },
        {
          id: 'result-edge',
          from: 'packet',
          to: 'result',
          label: 'execute',
          kind: 'FLOW',
        },
      ],
      groups: [],
      claimIds: ['claim-decomposition'],
      evidenceSpanIds: ['evidence-decompose'],
      layout: 'LEFT_TO_RIGHT',
    }),
  ]

  const sectionInputs = [
    [
      'section-sentence',
      'PAPER_IN_ONE_SENTENCE',
      'FIVE_MINUTES',
      'Paper in one sentence',
      'A synthetic system splits one request into concurrent work packets, then verifies their merge.',
      ['claim-decomposition', 'claim-concurrency'],
      ['evidence-decompose', 'evidence-concurrency'],
    ],
    [
      'section-visual',
      'VISUAL_ABSTRACT',
      'FIVE_MINUTES',
      'Visual abstract',
      'The baseline is sequential; the proposal separates decomposition, concurrent execution, and verification.',
      ['claim-concurrency', 'claim-baseline'],
      ['evidence-concurrency', 'evidence-baseline'],
    ],
    [
      'section-summary',
      'EXECUTIVE_SUMMARY',
      'FIVE_MINUTES',
      'What matters',
      'The mechanism changes scheduling in the fixture. It does not establish production economics.',
      ['claim-scheduling-interpretation', 'claim-cost-savings'],
      ['evidence-weights'],
    ],
    [
      'section-background',
      'BACKGROUND',
      'MECHANISM',
      'Background',
      'Parallel work is only safe when packets are bounded and their effects can be merged.',
      ['claim-decomposition'],
      ['evidence-decompose'],
    ],
    [
      'section-mechanism',
      'MECHANISM',
      'MECHANISM',
      'Mechanism',
      'Four workers read shared context, write separate partitions, and converge through a verified merge.',
      ['claim-concurrency', 'claim-cache'],
      ['evidence-concurrency', 'evidence-cache'],
    ],
    [
      'section-technical',
      'TECHNICAL_EVIDENCE',
      'EVIDENCE',
      'Technical evidence',
      'The fixture records 90 synthetic ms for the baseline and 20 synthetic ms for the parallel path.',
      ['claim-delay-calculation'],
      ['evidence-delay'],
    ],
    [
      'section-frontier',
      'AI_FRONTIER',
      'MECHANISM',
      'AI frontier relevance',
      'The fixture is useful for studying orchestration boundaries, but it makes no claim about model capability.',
      ['claim-scheduling-interpretation', 'claim-weights-contradicted'],
      ['evidence-weights'],
    ],
    [
      'section-trade',
      'AI_TRADE',
      'FIVE_MINUTES',
      'Investment interpretation',
      'No direct trade implication: the fixture has no production cost, demand, company, or security evidence.',
      ['claim-no-trade'],
      ['evidence-no-market', 'evidence-no-trade'],
    ],
    [
      'section-watch',
      'WATCH_NEXT',
      'EVIDENCE',
      'What to watch next',
      'A real evaluation would need measured cost, failure rates, workload conditions, and a comparable sequential baseline.',
      ['claim-cost-savings'],
      [],
    ],
    [
      'section-concepts',
      'CONCEPTS_AND_SOURCES',
      'EVIDENCE',
      'Concepts and sources',
      'Explore work packets, shared caches, idempotency, KV caches, and multi-head latent attention with the synthetic source open.',
      ['claim-cache', 'claim-retry'],
      ['evidence-cache', 'evidence-retry'],
    ],
  ] as const

  const sections = sectionInputs.map((input, index) =>
    ReportSectionSchema.parse({
      schemaVersion,
      id: input[0],
      reportId: 'report-agent-swarm-demo',
      kind: input[1],
      depth: input[2],
      order: index,
      blocks: [
        {
          id: `${input[0]}-block`,
          heading: input[3],
          body: input[4],
          claimIds: [...input[5]],
          evidenceSpanIds: [...input[6]],
        },
      ],
    }),
  )

  const report = ReportSchema.parse({
    schemaVersion,
    id: 'report-agent-swarm-demo',
    paperVersionId: version.id,
    slug: 'agent-swarm-demo',
    status: 'READY_FOR_EDITOR',
    readingTimeMinutes: 12,
    sectionIds: sections.map((section) => section.id),
    claimIds: claims.map((claim) => claim.id),
    conceptIds: concepts.map((concept) => concept.id),
    visualIds: visuals.map((visual) => visual.id),
    createdAt: '2026-07-21T00:00:00.000Z',
    updatedAt: '2026-07-21T00:00:00.000Z',
    editorApproval: null,
  })

  const newsletter = NewsletterSchema.parse({
    reportId: report.id,
    bullets: [
      'Claim: the synthetic study proposes splitting one request into bounded work packets.',
      'Who and why now: Glyph Synthetic Lab created this controlled fixture to test source-linked teaching safely.',
      'Mechanism: four workers execute separate packets before a verified merge.',
      'AI frontier relevance: the fixture demonstrates orchestration boundaries, not model capability or production economics.',
      'Investor relevance and concepts: no direct trade implication; it teaches work packets, shared caches, and idempotency.',
    ],
  })

  const answers = [
    QuestionAnswerSchema.parse({
      schemaVersion,
      id: 'answer-worker-count',
      reportId: report.id,
      question: 'How many workers run concurrently?',
      outcome: 'ANSWER',
      answerText:
        'The synthetic fixture states that four workers execute concurrently.',
      evidenceSpanIds: ['evidence-concurrency'],
      generatedAt: '2026-07-21T00:00:00.000Z',
      validatedAt: '2026-07-21T00:00:00.000Z',
    }),
    QuestionAnswerSchema.parse({
      schemaVersion,
      id: 'answer-market-impact',
      reportId: report.id,
      question: 'Which public company benefits most?',
      outcome: 'INSUFFICIENT_EVIDENCE',
      answerText: null,
      evidenceSpanIds: [],
      generatedAt: '2026-07-21T00:00:00.000Z',
      validatedAt: '2026-07-21T00:00:00.000Z',
    }),
  ]

  return {
    disclosure: syntheticDisclosure,
    paper,
    version,
    report,
    sections,
    claims,
    evidenceSpans,
    concepts,
    visuals,
    newsletter,
    socialPreview: {
      hook: 'What changes when one synthetic task becomes four bounded work packets?',
      observations: [
        'The fixture separates decomposition from execution.',
        'A verified merge remains mandatory after concurrent work.',
        'Production cost and market demand are not measured.',
      ],
      sourcePath: version.assetPath,
      reportPath: `/reports/${report.slug}`,
      disclaimer:
        'Synthetic demonstration only. No investment conclusion is supported.',
    },
    answers,
  }
}
