import { z } from 'zod'

export const schemaVersion = 1 as const

export const IdSchema = z.string().trim().min(1).max(160)
export type Id = z.infer<typeof IdSchema>

const NonEmptyTextSchema = z.string().trim().min(1)
const SlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

export const SourceKindSchema = z.enum([
  'LAB',
  'AUTHOR',
  'REPOSITORY',
  'FEED',
  'ECONOMIC_DATA',
])

export const SourceRightsSchema = z.enum([
  'PUBLIC_REUSE_ALLOWED',
  'METADATA_ONLY',
  'EXTERNAL_LINK_ONLY',
  'PROHIBITED',
])

export const SourceRegistryEntrySchema = z
  .object({
    schemaVersion: z.literal(schemaVersion),
    id: IdSchema,
    name: NonEmptyTextSchema,
    kind: SourceKindSchema,
    baseUrl: z.url(),
    enabled: z.boolean(),
    priority: z.number().int().min(1).max(100),
    rights: SourceRightsSchema,
    connectorKey: NonEmptyTextSchema,
    editorialNotes: NonEmptyTextSchema.nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .superRefine((source, context) => {
    if (source.enabled && source.rights === 'PROHIBITED') {
      context.addIssue({
        code: 'custom',
        message: 'Prohibited sources cannot be enabled',
        path: ['enabled'],
      })
    }
  })
export type SourceRegistryEntry = z.infer<typeof SourceRegistryEntrySchema>

export const SourceAuditEventSchema = z.object({
  schemaVersion: z.literal(schemaVersion),
  id: IdSchema,
  sourceId: IdSchema,
  actorId: IdSchema,
  action: z.enum(['CREATED', 'UPDATED', 'ENABLED', 'DISABLED', 'TESTED']),
  outcome: z.enum(['SUCCEEDED', 'FAILED']),
  detail: NonEmptyTextSchema,
  occurredAt: z.iso.datetime(),
})
export type SourceAuditEvent = z.infer<typeof SourceAuditEventSchema>

export const PaperSchema = z.object({
  schemaVersion: z.literal(schemaVersion),
  id: IdSchema,
  title: NonEmptyTextSchema,
  authors: z.array(NonEmptyTextSchema).min(1),
  lab: NonEmptyTextSchema.nullable(),
  canonicalUrl: z.url(),
  sourceId: IdSchema,
  topicLabels: z.array(NonEmptyTextSchema),
  mechanismLabels: z.array(NonEmptyTextSchema),
  difficulty: z.enum([
    'UNCLASSIFIED',
    'FOUNDATIONAL',
    'INTERMEDIATE',
    'ADVANCED',
  ]),
  selectionRationale: NonEmptyTextSchema.nullable(),
})
export type Paper = z.infer<typeof PaperSchema>

export const LayerSchema = z.enum([
  'CHIPS_COMPUTE',
  'CLOUD_INFRASTRUCTURE',
  'MODELS',
  'APPLICATIONS',
])
export type Layer = z.infer<typeof LayerSchema>

export const SourceTypeSchema = z.enum([
  'FIRST_PARTY_TECHNICAL_LAUNCH_BLOG',
  'TECHNICAL_REPORT',
  'RESEARCH_PAPER',
])
export type SourceType = z.infer<typeof SourceTypeSchema>

export const SourceArtifactSchema = z
  .object({
    schemaVersion: z.literal(schemaVersion),
    id: SlugSchema,
    canonicalTitle: NonEmptyTextSchema,
    canonicalUrl: z.url(),
    organization: NonEmptyTextSchema,
    sourceName: NonEmptyTextSchema,
    sourceType: SourceTypeSchema,
    publicationDate: z.iso.date(),
    primarySource: z.boolean(),
    primaryLayer: LayerSchema,
    secondaryLayers: z.array(LayerSchema),
    technicalReportAvailable: z.boolean(),
    technicalReportStatus: z.enum([
      'AVAILABLE',
      'ANNOUNCED_NOT_ATTACHED',
      'NOT_ANNOUNCED',
    ]),
    accessLevel: z.enum(['PUBLIC', 'RESTRICTED']),
  })
  .superRefine((source, context) => {
    if (source.secondaryLayers.includes(source.primaryLayer)) {
      context.addIssue({
        code: 'custom',
        message: 'Primary layer cannot also be a secondary layer',
        path: ['secondaryLayers'],
      })
    }
    if (
      source.technicalReportAvailable &&
      source.technicalReportStatus !== 'AVAILABLE'
    ) {
      context.addIssue({
        code: 'custom',
        message: 'An available technical report requires AVAILABLE status',
        path: ['technicalReportStatus'],
      })
    }
  })
export type SourceArtifact = z.infer<typeof SourceArtifactSchema>

export const ClaimTypeSchema = z.enum([
  'PAPER_FACT',
  'MEASURED_RESULT',
  'AUTHOR_CLAIM',
  'GLYPH_CALCULATION',
  'GLYPH_INTERPRETATION',
  'INVESTMENT_HYPOTHESIS',
  'INSUFFICIENT_EVIDENCE',
])
export type ClaimType = z.infer<typeof ClaimTypeSchema>

export const TechnicalLabelSchema = z.object({
  label: NonEmptyTextSchema,
  claimType: ClaimTypeSchema,
})

export const TechnicalLabelsSchema = z.object({
  architecture: z.array(TechnicalLabelSchema).min(1),
  capabilities: z.array(TechnicalLabelSchema).min(1),
  resourceImplications: z.array(TechnicalLabelSchema).min(1),
})
export type TechnicalLabels = z.infer<typeof TechnicalLabelsSchema>

export const PaperVersionSchema = z.object({
  schemaVersion: z.literal(schemaVersion),
  id: IdSchema,
  paperId: IdSchema,
  versionLabel: NonEmptyTextSchema,
  checksumSha256: z.string().regex(/^[a-f0-9]{64}$/),
  licenceStatus: z.enum(['PUBLIC', 'PERMITTED', 'RESTRICTED']),
  publicationDate: z.iso.date(),
  revisionDate: z.iso.date(),
  pageCount: z.number().int().positive(),
  assetReference: NonEmptyTextSchema.nullable(),
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
    if (box.x + box.width > 1 || box.y + box.height > 1) {
      context.addIssue({
        code: 'custom',
        message: 'Evidence box must remain within normalized page bounds',
      })
    }
  })

export const EvidenceSpanSchema = z.object({
  schemaVersion: z.literal(schemaVersion),
  id: IdSchema,
  paperVersionId: IdSchema,
  pageNumber: z.number().int().positive(),
  sectionTitle: NonEmptyTextSchema.optional(),
  text: NonEmptyTextSchema,
  boundingBoxes: z.array(NormalizedBoxSchema).min(1),
})
export type EvidenceSpan = z.infer<typeof EvidenceSpanSchema>

export const ClaimKindSchema = z.enum([
  'PAPER_FACT',
  'MEASURED_RESULT',
  'AUTHOR_CLAIM',
  'GLYPH_CALCULATION',
  'GLYPH_INTERPRETATION',
  'INVESTMENT_HYPOTHESIS',
  'INSUFFICIENT_EVIDENCE',
])
export type ClaimKind = z.infer<typeof ClaimKindSchema>

export const ClaimSchema = z
  .object({
    schemaVersion: z.literal(schemaVersion),
    id: IdSchema,
    reportId: IdSchema,
    text: NonEmptyTextSchema,
    kind: ClaimKindSchema,
    material: z.boolean(),
    supportStatus: z.enum([
      'SUPPORTED',
      'CONTRADICTED',
      'INSUFFICIENT_EVIDENCE',
    ]),
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

export const EvidenceLinkedClaimsSchema = z
  .object({
    claims: z.array(ClaimSchema),
    evidenceSpans: z.array(EvidenceSpanSchema),
  })
  .superRefine((corpus, context) => {
    const evidenceIds = new Set(corpus.evidenceSpans.map((span) => span.id))
    corpus.claims.forEach((claim, claimIndex) => {
      claim.evidenceSpanIds.forEach((evidenceId, evidenceIndex) => {
        if (!evidenceIds.has(evidenceId)) {
          context.addIssue({
            code: 'custom',
            message: `Claim ${claim.id} references unknown evidence span ${evidenceId}`,
            path: ['claims', claimIndex, 'evidenceSpanIds', evidenceIndex],
          })
        }
      })
    })
  })

export const ReportStatusSchema = z.enum([
  'DRAFT',
  'QA_BLOCKED',
  'READY_FOR_EDITOR',
  'APPROVED',
  'PUBLISHED',
])
export type ReportStatus = z.infer<typeof ReportStatusSchema>

export const ReportSectionSchema = z.object({
  schemaVersion: z.literal(schemaVersion),
  id: IdSchema,
  reportId: IdSchema,
  kind: z.enum([
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
  ]),
  depth: z.enum(['FIVE_MINUTES', 'MECHANISM', 'EVIDENCE']),
  order: z.number().int().nonnegative(),
  blocks: z
    .array(
      z.object({
        id: IdSchema,
        heading: NonEmptyTextSchema.nullable(),
        body: NonEmptyTextSchema,
        claimIds: z.array(IdSchema),
        evidenceSpanIds: z.array(IdSchema),
      }),
    )
    .min(1),
})
export type ReportSection = z.infer<typeof ReportSectionSchema>

export const ReportSchema = z.object({
  schemaVersion: z.literal(schemaVersion),
  id: IdSchema,
  paperVersionId: IdSchema,
  slug: SlugSchema,
  status: ReportStatusSchema,
  readingTimeMinutes: z.number().int().positive(),
  sectionIds: z.array(IdSchema).min(1),
  claimIds: z.array(IdSchema).min(1),
  conceptIds: z.array(IdSchema),
  visualIds: z.array(IdSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  editorApproval: z
    .object({ editorId: IdSchema, approvedAt: z.iso.datetime() })
    .nullable(),
})
export type Report = z.infer<typeof ReportSchema>

export const ConceptCardSchema = z.object({
  schemaVersion: z.literal(schemaVersion),
  id: IdSchema,
  name: NonEmptyTextSchema,
  shortDefinition: NonEmptyTextSchema,
  contextualExplanation: NonEmptyTextSchema,
  relevance: NonEmptyTextSchema,
  analogy: NonEmptyTextSchema.nullable(),
  canonicalSource: z.url().nullable(),
  relatedConceptIds: z.array(IdSchema),
})
export type ConceptCard = z.infer<typeof ConceptCardSchema>

export const VisualSpecSchema = z
  .object({
    schemaVersion: z.literal(schemaVersion),
    id: IdSchema,
    title: NonEmptyTextSchema,
    purpose: NonEmptyTextSchema,
    nodes: z
      .array(
        z.object({
          id: IdSchema,
          label: NonEmptyTextSchema,
          kind: z.enum(['INPUT', 'PROCESS', 'STORE', 'OUTPUT', 'ANNOTATION']),
          value: z.number().nullable(),
          unit: NonEmptyTextSchema.nullable(),
        }),
      )
      .min(1),
    edges: z.array(
      z.object({
        id: IdSchema,
        from: IdSchema,
        to: IdSchema,
        label: NonEmptyTextSchema.nullable(),
        kind: z.enum(['FLOW', 'STORE', 'DISCARD', 'COMPARE']),
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
        })
      }
    }
    for (const edge of visual.edges) {
      if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
        context.addIssue({
          code: 'custom',
          message: `Edge ${edge.id} references an unknown node`,
        })
      }
    }
  })
export type VisualSpec = z.infer<typeof VisualSpecSchema>

export const MarketMetricSchema = z.object({
  schemaVersion: z.literal(schemaVersion),
  id: IdSchema,
  reportId: IdSchema,
  sourceUrl: z.url(),
  retrievalDate: z.iso.date(),
  modelOrProductVersion: NonEmptyTextSchema,
  value: z.number(),
  unit: NonEmptyTextSchema,
  denominator: NonEmptyTextSchema,
  conditions: NonEmptyTextSchema,
  relevance: NonEmptyTextSchema,
  comparisonLimitations: NonEmptyTextSchema,
})
export type MarketMetric = z.infer<typeof MarketMetricSchema>

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
  idempotencyKey: NonEmptyTextSchema,
  status: z.enum(['PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'BLOCKED']),
  result: z.record(z.string(), z.unknown()).nullable(),
  error: z
    .object({ code: NonEmptyTextSchema, message: NonEmptyTextSchema })
    .nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
export type PipelineRun = z.infer<typeof PipelineRunSchema>

export const NewsletterSchema = z.object({
  reportId: IdSchema,
  bullets: z.tuple([
    NonEmptyTextSchema,
    NonEmptyTextSchema,
    NonEmptyTextSchema,
    NonEmptyTextSchema,
    NonEmptyTextSchema,
  ]),
})

export type PublicationBlocker = {
  code:
    | 'MATERIAL_CLAIM_WITHOUT_EVIDENCE'
    | 'EVIDENCE_VERSION_MISMATCH'
    | 'EVIDENCE_PAGE_OUT_OF_RANGE'
    | 'VISUAL_REFERENCE_UNKNOWN'
    | 'MARKET_METRIC_INVALID'
    | 'INTEGRITY_REVIEW_INCOMPLETE'
    | 'REPORT_NOT_EDITOR_APPROVED'
  message: string
  recordId: Id
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

export function publicationBlockers(
  input: PublicationInput,
): PublicationBlocker[] {
  const blockers: PublicationBlocker[] = []
  const evidenceById = new Map(
    input.evidenceSpans.map((span) => [span.id, span]),
  )
  const claimIds = new Set(input.claims.map((claim) => claim.id))
  const evidenceIds = new Set(input.evidenceSpans.map((span) => span.id))

  for (const claim of input.claims) {
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
      if (evidence?.paperVersionId !== input.paperVersion.id) {
        blockers.push({
          code: 'EVIDENCE_VERSION_MISMATCH',
          message: `Claim ${claim.id} references evidence from another version`,
          recordId: claim.id,
        })
      } else if (evidence.pageNumber > input.paperVersion.pageCount) {
        blockers.push({
          code: 'EVIDENCE_PAGE_OUT_OF_RANGE',
          message: `Evidence ${evidence.id} exceeds the paper page count`,
          recordId: evidence.id,
        })
      }
    }
  }

  for (const visual of input.visuals) {
    if (
      visual.claimIds.some((id) => !claimIds.has(id)) ||
      visual.evidenceSpanIds.some((id) => !evidenceIds.has(id))
    ) {
      blockers.push({
        code: 'VISUAL_REFERENCE_UNKNOWN',
        message: `Visual ${visual.id} contains an unknown evidence reference`,
        recordId: visual.id,
      })
    }
  }

  for (const metric of input.marketMetrics) {
    if (!MarketMetricSchema.safeParse(metric).success) {
      blockers.push({
        code: 'MARKET_METRIC_INVALID',
        message: `Report ${input.report.id} contains an invalid market metric`,
        recordId: input.report.id,
      })
    }
  }

  if (Object.values(input.integrityReview).some((value) => !value)) {
    blockers.push({
      code: 'INTEGRITY_REVIEW_INCOMPLETE',
      message: `Report ${input.report.id} has incomplete integrity review`,
      recordId: input.report.id,
    })
  }
  if (
    input.report.status !== 'APPROVED' ||
    input.report.editorApproval === null
  ) {
    blockers.push({
      code: 'REPORT_NOT_EDITOR_APPROVED',
      message: `Report ${input.report.id} is not editor approved`,
      recordId: input.report.id,
    })
  }
  return blockers
}
