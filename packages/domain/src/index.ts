import { z } from 'zod'

export const schemaVersion = 1 as const

export const IdSchema = z.string().trim().min(1)
export type Id = z.infer<typeof IdSchema>

export const SourceTypeSchema = z.enum([
  'PUBLIC',
  'EXTERNAL_RESTRICTED',
  'SYNTHETIC_DEMO',
])
export type SourceType = z.infer<typeof SourceTypeSchema>

export const PaperSchema = z
  .object({
    schemaVersion: z.literal(schemaVersion),
    id: IdSchema,
    title: z.string().trim().min(1),
    authors: z.array(z.string().trim().min(1)).min(1),
    lab: z.string().trim().min(1),
    canonicalUrl: z.url().nullable(),
    sourceType: SourceTypeSchema,
    topicLabels: z.array(z.string().trim().min(1)),
    mechanismLabels: z.array(z.string().trim().min(1)),
    difficulty: z.enum(['FOUNDATIONAL', 'INTERMEDIATE', 'ADVANCED']),
    selectionRationale: z.string().trim().min(1),
    syntheticDisclosure: z.string().trim().min(1).nullable(),
  })
  .superRefine((paper, context) => {
    if (
      paper.sourceType === 'SYNTHETIC_DEMO' &&
      paper.syntheticDisclosure === null
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Synthetic demo papers require an explicit disclosure',
        path: ['syntheticDisclosure'],
      })
    }
  })
export type Paper = z.infer<typeof PaperSchema>

export const PaperVersionSchema = z.object({
  schemaVersion: z.literal(schemaVersion),
  id: IdSchema,
  paperId: IdSchema,
  versionLabel: z.string().trim().min(1),
  checksumSha256: z.string().regex(/^[a-f0-9]{64}$/),
  licenceStatus: z.enum(['PUBLIC', 'PERMITTED', 'RESTRICTED', 'SYNTHETIC']),
  publicationDate: z.iso.date(),
  revisionDate: z.iso.date(),
  pageCount: z.number().int().positive(),
  assetPath: z.string().trim().min(1),
})
export type PaperVersion = z.infer<typeof PaperVersionSchema>

export const NormalizedBoxSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().positive().max(1),
    height: z.number().positive().max(1),
  })
  .superRefine((box, context) => {
    if (box.x + box.width > 1) {
      context.addIssue({ code: 'custom', message: 'Box exceeds page width' })
    }
    if (box.y + box.height > 1) {
      context.addIssue({ code: 'custom', message: 'Box exceeds page height' })
    }
  })
export type NormalizedBox = z.infer<typeof NormalizedBoxSchema>

export const EvidenceSpanSchema = z.object({
  schemaVersion: z.literal(schemaVersion),
  id: IdSchema,
  paperVersionId: IdSchema,
  pageNumber: z.number().int().positive(),
  section: z.string().trim().min(1),
  exactText: z.string().trim().min(1),
  boxes: z.array(NormalizedBoxSchema).min(1),
})
export type EvidenceSpan = z.infer<typeof EvidenceSpanSchema>

export const ClaimKindSchema = z.enum([
  'PAPER_FACT',
  'AUTHOR_CLAIM',
  'GLYPH_CALCULATION',
  'GLYPH_INTERPRETATION',
  'INVESTMENT_HYPOTHESIS',
])
export type ClaimKind = z.infer<typeof ClaimKindSchema>

export const SupportStatusSchema = z.enum([
  'SUPPORTED',
  'CONTRADICTED',
  'INSUFFICIENT_EVIDENCE',
])

export const ClaimSchema = z
  .object({
    schemaVersion: z.literal(schemaVersion),
    id: IdSchema,
    reportId: IdSchema,
    text: z.string().trim().min(1),
    kind: ClaimKindSchema,
    material: z.boolean(),
    supportStatus: SupportStatusSchema,
    evidenceSpanIds: z.array(IdSchema),
  })
  .superRefine((claim, context) => {
    if (
      claim.material &&
      claim.supportStatus === 'SUPPORTED' &&
      claim.evidenceSpanIds.length === 0
    ) {
      context.addIssue({
        code: 'custom',
        message: 'A supported material claim requires evidence',
        path: ['evidenceSpanIds'],
      })
    }
  })
export type Claim = z.infer<typeof ClaimSchema>

export const ReportStatusSchema = z.enum([
  'DRAFT',
  'QA_BLOCKED',
  'READY_FOR_EDITOR',
  'APPROVED',
  'PUBLISHED',
])
export type ReportStatus = z.infer<typeof ReportStatusSchema>

export const ReportDepthSchema = z.enum([
  'FIVE_MINUTES',
  'MECHANISM',
  'EVIDENCE',
])

export const ReportSectionKindSchema = z.enum([
  'PAPER_IN_ONE_SENTENCE',
  'VISUAL_ABSTRACT',
  'EXECUTIVE_SUMMARY',
  'BACKGROUND',
  'MECHANISM',
  'TECHNICAL_EVIDENCE',
  'AI_FRONTIER',
  'AI_TRADE',
  'WATCH_NEXT',
  'CONCEPTS_AND_SOURCES',
])

export const ReportContentBlockSchema = z.object({
  id: IdSchema,
  heading: z.string().trim().min(1).nullable(),
  body: z.string().trim().min(1),
  claimIds: z.array(IdSchema),
  evidenceSpanIds: z.array(IdSchema),
})

export const ReportSectionSchema = z.object({
  schemaVersion: z.literal(schemaVersion),
  id: IdSchema,
  reportId: IdSchema,
  kind: ReportSectionKindSchema,
  depth: ReportDepthSchema,
  order: z.number().int().nonnegative(),
  blocks: z.array(ReportContentBlockSchema).min(1),
})
export type ReportSection = z.infer<typeof ReportSectionSchema>

export const ReportSchema = z.object({
  schemaVersion: z.literal(schemaVersion),
  id: IdSchema,
  paperVersionId: IdSchema,
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  status: ReportStatusSchema,
  readingTimeMinutes: z.number().int().positive(),
  sectionIds: z.array(IdSchema).min(1),
  claimIds: z.array(IdSchema).min(1),
  conceptIds: z.array(IdSchema),
  visualIds: z.array(IdSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  editorApproval: z
    .object({
      editorId: IdSchema,
      approvedAt: z.iso.datetime(),
    })
    .nullable(),
})
export type Report = z.infer<typeof ReportSchema>

export const ConceptCardSchema = z.object({
  schemaVersion: z.literal(schemaVersion),
  id: IdSchema,
  name: z.string().trim().min(1),
  shortDefinition: z.string().trim().min(1),
  contextualExplanation: z.string().trim().min(1),
  relevance: z.string().trim().min(1),
  analogy: z.string().trim().min(1).nullable(),
  visualSpecId: IdSchema.nullable(),
  canonicalSource: z.url().nullable(),
  relatedConceptIds: z.array(IdSchema),
})
export type ConceptCard = z.infer<typeof ConceptCardSchema>

export const VisualNodeSchema = z.object({
  id: IdSchema,
  label: z.string().trim().min(1),
  kind: z.enum(['INPUT', 'PROCESS', 'STORE', 'OUTPUT', 'ANNOTATION']),
  value: z.number().nullable(),
  unit: z.string().trim().min(1).nullable(),
})

export const VisualEdgeSchema = z.object({
  id: IdSchema,
  from: IdSchema,
  to: IdSchema,
  label: z.string().trim().min(1).nullable(),
  kind: z.enum(['FLOW', 'STORE', 'DISCARD', 'COMPARE']),
})

export const VisualSpecSchema = z
  .object({
    schemaVersion: z.literal(schemaVersion),
    id: IdSchema,
    title: z.string().trim().min(1),
    purpose: z.string().trim().min(1),
    nodes: z.array(VisualNodeSchema).min(1),
    edges: z.array(VisualEdgeSchema),
    groups: z.array(
      z.object({
        id: IdSchema,
        label: z.string().trim().min(1),
        nodeIds: z.array(IdSchema).min(1),
      }),
    ),
    claimIds: z.array(IdSchema),
    evidenceSpanIds: z.array(IdSchema),
    layout: z.enum(['LEFT_TO_RIGHT', 'TOP_TO_BOTTOM', 'BASELINE_COMPARE']),
  })
  .superRefine((visual, context) => {
    const nodeIds = new Set(visual.nodes.map((node) => node.id))
    for (const node of visual.nodes) {
      if (node.value !== null && node.unit === null) {
        context.addIssue({
          code: 'custom',
          message: `Numerical node ${node.id} requires a unit`,
          path: ['nodes'],
        })
      }
    }
    for (const edge of visual.edges) {
      if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
        context.addIssue({
          code: 'custom',
          message: `Edge ${edge.id} references an unknown node`,
          path: ['edges'],
        })
      }
    }
    for (const group of visual.groups) {
      if (group.nodeIds.some((id) => !nodeIds.has(id))) {
        context.addIssue({
          code: 'custom',
          message: `Group ${group.id} references an unknown node`,
          path: ['groups'],
        })
      }
    }
  })
export type VisualSpec = z.infer<typeof VisualSpecSchema>

export const MarketMetricSchema = z.object({
  schemaVersion: z.literal(schemaVersion),
  id: IdSchema,
  sourceUrl: z.url(),
  retrievalDate: z.iso.date(),
  modelOrProductVersion: z.string().trim().min(1),
  value: z.number(),
  unit: z.string().trim().min(1),
  denominator: z.string().trim().min(1),
  conditions: z.string().trim().min(1),
  relevance: z.string().trim().min(1),
  comparisonLimitations: z.string().trim().min(1),
})
export type MarketMetric = z.infer<typeof MarketMetricSchema>

export const UserRoleSchema = z.enum(['VISITOR', 'SUBSCRIBER', 'EDITOR'])
export type UserRole = z.infer<typeof UserRoleSchema>

export const UserProfileSchema = z.object({
  schemaVersion: z.literal(schemaVersion),
  id: IdSchema,
  role: UserRoleSchema,
  preferences: z.record(z.string(), z.boolean()),
  savedConceptIds: z.array(IdSchema),
})
export type UserProfile = z.infer<typeof UserProfileSchema>

export const QuestionAnswerSchema = z
  .object({
    schemaVersion: z.literal(schemaVersion),
    id: IdSchema,
    reportId: IdSchema,
    question: z.string().trim().min(1),
    outcome: z.enum(['ANSWER', 'INSUFFICIENT_EVIDENCE']),
    answerText: z.string().trim().min(1).nullable(),
    evidenceSpanIds: z.array(IdSchema),
    generatedAt: z.iso.datetime(),
    validatedAt: z.iso.datetime(),
  })
  .superRefine((answer, context) => {
    if (
      answer.outcome === 'ANSWER' &&
      (answer.answerText === null || answer.evidenceSpanIds.length === 0)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'An answer requires text and evidence',
      })
    }
    if (
      answer.outcome === 'INSUFFICIENT_EVIDENCE' &&
      answer.answerText !== null
    ) {
      context.addIssue({
        code: 'custom',
        message:
          'Insufficient evidence must not include speculative answer text',
      })
    }
  })
export type QuestionAnswer = z.infer<typeof QuestionAnswerSchema>

export const AiTaskSchema = z.enum([
  'classify',
  'extract-evidence',
  'synthesize-report',
  'critique-report',
  'answer-question',
])
export type AiTask = z.infer<typeof AiTaskSchema>

export const AiClassificationOutputSchema = z
  .object({
    label: z.string().trim().min(1),
    rationale: z.string().trim().min(1),
  })
  .strict()

export const AiEvidenceExtractionOutputSchema = z
  .object({
    extracted: z.boolean(),
    evidenceSpanIds: z.array(IdSchema),
  })
  .strict()

export const AiReportSynthesisOutputSchema = z
  .object({
    mocked: z.boolean(),
    reportId: IdSchema.nullable(),
  })
  .strict()

export const AiCritiqueOutputSchema = z
  .object({
    reportId: IdSchema,
    blockers: z.array(z.string().trim().min(1)),
  })
  .strict()

export const AiCitedAnswerOutputSchema = z
  .object({
    outcome: z.enum(['ANSWER', 'INSUFFICIENT_EVIDENCE']),
    answerText: z.string().trim().min(1).nullable(),
    evidenceSpanIds: z.array(IdSchema),
  })
  .strict()
  .superRefine((answer, context) => {
    if (
      answer.outcome === 'ANSWER' &&
      (answer.answerText === null || answer.evidenceSpanIds.length === 0)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'A cited model answer requires text and evidence',
      })
    }
    if (
      answer.outcome === 'INSUFFICIENT_EVIDENCE' &&
      (answer.answerText !== null || answer.evidenceSpanIds.length > 0)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Insufficient evidence cannot contain answer content',
      })
    }
  })

export const AiModelOutputSchema = z
  .object({
    schemaVersion: z.literal(schemaVersion),
    result: z.record(z.string(), z.unknown()),
  })
  .strict()

export const AiGenerationRecordSchema = z.object({
  schemaVersion: z.literal(schemaVersion),
  task: AiTaskSchema,
  model: z.string().trim().min(1),
  promptVersion: z.string().trim().min(1),
  outputSchemaVersion: z.number().int().positive(),
  generatedAt: z.iso.datetime(),
  sourcePaperVersionId: IdSchema.nullable(),
  result: z.unknown(),
})
export type AiGenerationRecord = z.infer<typeof AiGenerationRecordSchema>

export const PipelineStageSchema = z.enum([
  'DISCOVER',
  'CLASSIFY',
  'RANK',
  'SELECT',
  'PARSE',
  'EXTRACT_EVIDENCE',
  'GENERATE_OUTLINE',
  'GENERATE_REPORT',
  'GENERATE_VISUALS',
  'AUTOMATED_QA',
  'EDITOR_APPROVAL',
  'PUBLISH',
  'DISTRIBUTE',
])
export type PipelineStage = z.infer<typeof PipelineStageSchema>

export const PipelineRunSchema = z.object({
  schemaVersion: z.literal(schemaVersion),
  id: IdSchema,
  paperVersionId: IdSchema,
  stage: PipelineStageSchema,
  attempt: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(1),
  status: z.enum(['PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'BLOCKED']),
  result: z.record(z.string(), z.unknown()).nullable(),
  error: z.object({ code: z.string(), message: z.string() }).nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
export type PipelineRun = z.infer<typeof PipelineRunSchema>

export const NewsletterSchema = z.object({
  reportId: IdSchema,
  bullets: z.tuple([
    z.string().trim().min(1),
    z.string().trim().min(1),
    z.string().trim().min(1),
    z.string().trim().min(1),
    z.string().trim().min(1),
  ]),
})
export type Newsletter = z.infer<typeof NewsletterSchema>

export type PublicationBlocker = {
  code:
    | 'MATERIAL_CLAIM_WITHOUT_EVIDENCE'
    | 'EVIDENCE_VERSION_MISMATCH'
    | 'EVIDENCE_PAGE_OUT_OF_RANGE'
    | 'VISUAL_REFERENCE_UNKNOWN'
    | 'VISUAL_VALIDATION_FAILED'
    | 'PAGE_MAPPING_INVALID'
    | 'DEFINITION_VALIDATION_FAILED'
    | 'CLAIM_KIND_AMBIGUOUS'
    | 'MARKET_METRIC_INVALID'
    | 'REPORT_NOT_EDITOR_APPROVED'
    | 'EDITOR_APPROVAL_MISSING'
    | 'SYNTHETIC_DEMO_NOT_PUBLISHABLE'
  message: string
  recordId: Id
}

export function validateVisualReferences(
  visual: VisualSpec,
  claims: readonly Claim[],
  evidenceSpans: readonly EvidenceSpan[],
): PublicationBlocker[] {
  const claimIds = new Set(claims.map((claim) => claim.id))
  const evidenceIds = new Set(evidenceSpans.map((span) => span.id))
  const blockers: PublicationBlocker[] = []

  for (const claimId of visual.claimIds) {
    if (!claimIds.has(claimId)) {
      blockers.push({
        code: 'VISUAL_REFERENCE_UNKNOWN',
        message: `Visual ${visual.id} references unknown claim ${claimId}`,
        recordId: visual.id,
      })
    }
  }
  for (const evidenceId of visual.evidenceSpanIds) {
    if (!evidenceIds.has(evidenceId)) {
      blockers.push({
        code: 'VISUAL_REFERENCE_UNKNOWN',
        message: `Visual ${visual.id} references unknown evidence ${evidenceId}`,
        recordId: visual.id,
      })
    }
  }
  return blockers
}

export type PublicationInput = {
  report: Report
  paperVersion: PaperVersion
  claims: readonly Claim[]
  evidenceSpans: readonly EvidenceSpan[]
  visuals: readonly VisualSpec[]
  marketMetrics: readonly unknown[]
  integrityReview: {
    pageMappingsValidated: boolean
    definitionsValidated: boolean
    claimKindsDistinct: boolean
    visualsValidated: boolean
  }
}

export function editorialReviewBlockers(
  input: PublicationInput,
): PublicationBlocker[] {
  const {
    report,
    paperVersion,
    claims,
    evidenceSpans,
    visuals,
    marketMetrics,
    integrityReview,
  } = input
  const blockers: PublicationBlocker[] = []
  const evidenceById = new Map(evidenceSpans.map((span) => [span.id, span]))

  for (const claim of claims) {
    if (
      claim.material &&
      (claim.supportStatus !== 'SUPPORTED' ||
        claim.evidenceSpanIds.length === 0)
    ) {
      blockers.push({
        code: 'MATERIAL_CLAIM_WITHOUT_EVIDENCE',
        message: `Material claim ${claim.id} lacks valid support`,
        recordId: claim.id,
      })
    }

    for (const evidenceId of claim.evidenceSpanIds) {
      const evidence = evidenceById.get(evidenceId)
      if (
        evidence === undefined ||
        evidence.paperVersionId !== paperVersion.id
      ) {
        blockers.push({
          code: 'EVIDENCE_VERSION_MISMATCH',
          message: `Claim ${claim.id} references evidence from another version`,
          recordId: claim.id,
        })
      } else if (evidence.pageNumber > paperVersion.pageCount) {
        blockers.push({
          code: 'EVIDENCE_PAGE_OUT_OF_RANGE',
          message: `Evidence ${evidence.id} exceeds the paper page count`,
          recordId: evidence.id,
        })
      }
    }
  }

  for (const visual of visuals) {
    blockers.push(...validateVisualReferences(visual, claims, evidenceSpans))
  }

  if (!integrityReview.pageMappingsValidated) {
    blockers.push({
      code: 'PAGE_MAPPING_INVALID',
      message: `Report ${report.id} has unvalidated page mappings`,
      recordId: report.id,
    })
  }
  if (!integrityReview.definitionsValidated) {
    blockers.push({
      code: 'DEFINITION_VALIDATION_FAILED',
      message: `Report ${report.id} has unvalidated contextual definitions`,
      recordId: report.id,
    })
  }
  if (!integrityReview.claimKindsDistinct) {
    blockers.push({
      code: 'CLAIM_KIND_AMBIGUOUS',
      message: `Report ${report.id} has ambiguous claim kinds`,
      recordId: report.id,
    })
  }
  if (!integrityReview.visualsValidated) {
    blockers.push({
      code: 'VISUAL_VALIDATION_FAILED',
      message: `Report ${report.id} has unvalidated analytical diagrams`,
      recordId: report.id,
    })
  }
  for (const [index, metric] of marketMetrics.entries()) {
    const parsed = MarketMetricSchema.safeParse(metric)
    if (!parsed.success) {
      blockers.push({
        code: 'MARKET_METRIC_INVALID',
        message: `Market metric at index ${index} lacks required context`,
        recordId: report.id,
      })
    }
  }

  return blockers
}

export function publicationBlockers(
  input: PublicationInput,
): PublicationBlocker[] {
  const blockers = editorialReviewBlockers(input)
  const { report, paperVersion } = input

  if (paperVersion.licenceStatus === 'SYNTHETIC') {
    blockers.push({
      code: 'SYNTHETIC_DEMO_NOT_PUBLISHABLE',
      message: `Synthetic paper version ${paperVersion.id} is demo-only`,
      recordId: paperVersion.id,
    })
  }
  if (report.status !== 'APPROVED' && report.status !== 'PUBLISHED') {
    blockers.push({
      code: 'REPORT_NOT_EDITOR_APPROVED',
      message: `Report ${report.id} is not editor approved`,
      recordId: report.id,
    })
  }
  if (report.editorApproval === null) {
    blockers.push({
      code: 'EDITOR_APPROVAL_MISSING',
      message: `Report ${report.id} has no editor approval metadata`,
      recordId: report.id,
    })
  }

  return blockers
}
