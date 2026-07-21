import { z } from 'zod'

import {
  ClaimKindSchema,
  EvidenceSpanSchema,
  IdSchema,
  MarketMetricSchema,
  NormalizedBoxSchema,
  PaperVersionSchema,
  ReportSectionSchema,
  schemaVersion,
} from './index.js'

const TextSchema = z.string().trim().min(1)

export const RuntimeAgentNameSchema = z.enum([
  'paper_classifier',
  'shortlist_ranker',
  'evidence_extractor',
  'paper_summarizer',
  'concept_mapper',
  'market_context_analyst',
  'integrity_reviewer',
  'editorial_packager',
])
export type RuntimeAgentName = z.infer<typeof RuntimeAgentNameSchema>

export const AgentRunStatusSchema = z.enum([
  'PENDING',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'BLOCKED',
])

export const AgentRunErrorSchema = z.object({
  code: z.enum([
    'VALIDATION_ERROR',
    'REFUSAL',
    'RATE_LIMITED',
    'TIMEOUT',
    'PROVIDER_ERROR',
    'RETRY_EXHAUSTED',
    'INTEGRITY_BLOCKED',
  ]),
  message: TextSchema,
  retryable: z.boolean(),
})

export const AgentRunEnvelopeSchema = z.object({
  schemaVersion: z.literal(schemaVersion),
  id: IdSchema,
  runId: IdSchema,
  paperVersionId: IdSchema,
  agent: RuntimeAgentNameSchema,
  agentVersion: TextSchema,
  promptVersion: TextSchema,
  model: TextSchema,
  status: AgentRunStatusSchema,
  attempt: z.number().int().positive(),
  warnings: z.array(TextSchema),
  result: z.unknown().nullable(),
  error: AgentRunErrorSchema.nullable(),
  responseId: TextSchema.nullable(),
  startedAt: z.iso.datetime(),
  completedAt: z.iso.datetime().nullable(),
})
export type AgentRunEnvelope = z.infer<typeof AgentRunEnvelopeSchema>

export const LabelRuleSchema = z.object({
  id: IdSchema,
  kind: z.enum(['HARD_EXCLUSION', 'SEMANTIC']),
  label: TextSchema,
  description: TextSchema,
  weight: z.number().min(-1).max(1),
  examples: z.array(TextSchema),
})

export const PaperLabelOntologySchema = z.object({
  id: z.literal('paper-label-ontology.v1'),
  version: z.literal(1),
  status: z.enum(['DRAFT', 'ACTIVE', 'RETIRED']),
  rules: z.array(LabelRuleSchema).min(1),
  acceptanceThreshold: z.number().min(0).max(1),
  reviewBand: z.number().min(0).max(0.5),
  approvedAt: z.iso.datetime().nullable(),
  approvedBy: IdSchema.nullable(),
})
export type PaperLabelOntology = z.infer<typeof PaperLabelOntologySchema>

export const DocumentPageSchema = z.object({
  pageNumber: z.number().int().positive(),
  text: TextSchema,
  segments: z
    .array(
      z.object({
        id: IdSchema,
        exactText: TextSchema,
        boxes: z.array(NormalizedBoxSchema).min(1),
      }),
    )
    .min(1),
})

export const SourceDocumentSchema = z.object({
  sourceId: IdSchema,
  externalId: IdSchema,
  documentType: z.enum(['PAPER', 'MARKET_DATA']),
  title: TextSchema,
  abstract: TextSchema.nullable(),
  authors: z.array(TextSchema),
  canonicalUrl: z.url(),
  doi: TextSchema.nullable(),
  publicationDate: z.iso.date(),
  revisionDate: z.iso.date(),
  licenceStatus: z.enum(['PUBLIC', 'PERMITTED', 'RESTRICTED']),
  contentSha256: z.string().regex(/^[a-f0-9]{64}$/),
  assetReference: TextSchema.nullable(),
  pages: z.array(DocumentPageSchema).nullable(),
  pageCount: z.number().int().positive().nullable(),
})
export type SourceDocument = z.infer<typeof SourceDocumentSchema>

export const IngestedDocumentSchema = z.object({
  schemaVersion: z.literal(schemaVersion),
  id: IdSchema,
  fingerprint: TextSchema,
  sourceId: IdSchema,
  externalId: IdSchema,
  paperId: IdSchema.nullable(),
  paperVersionId: IdSchema.nullable(),
  document: SourceDocumentSchema,
  eligibility: z.enum(['ELIGIBLE', 'EXCLUDED', 'NEEDS_REVIEW']),
  exclusionCodes: z.array(
    z.enum([
      'SOURCE_DISABLED',
      'RIGHTS_PROHIBITED',
      'UNSUPPORTED_DOCUMENT_TYPE',
      'MISSING_METADATA',
      'DUPLICATE_VERSION',
    ]),
  ),
  ingestedAt: z.iso.datetime(),
})
export type IngestedDocument = z.infer<typeof IngestedDocumentSchema>

export const SourceScanSchema = z.object({
  schemaVersion: z.literal(schemaVersion),
  id: IdSchema,
  trigger: z.enum(['SCHEDULED', 'MANUAL']),
  sourceIds: z.array(IdSchema),
  status: z.enum(['RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED']),
  discovered: z.number().int().nonnegative(),
  ingested: z.number().int().nonnegative(),
  duplicates: z.number().int().nonnegative(),
  excluded: z.number().int().nonnegative(),
  errors: z.array(z.object({ sourceId: IdSchema, message: TextSchema })),
  startedAt: z.iso.datetime(),
  completedAt: z.iso.datetime().nullable(),
})
export type SourceScan = z.infer<typeof SourceScanSchema>

export const ClassificationInputSchema = z.object({
  ontology: PaperLabelOntologySchema,
  document: SourceDocumentSchema,
})
export type ClassificationInput = z.infer<typeof ClassificationInputSchema>

export const ClassificationOutputSchema = z.object({
  ontologyId: z.literal('paper-label-ontology.v1'),
  labels: z.array(TextSchema),
  mechanismLabels: z.array(TextSchema),
  difficulty: z.enum(['FOUNDATIONAL', 'INTERMEDIATE', 'ADVANCED']),
  ruleResults: z.array(
    z.object({
      ruleId: IdSchema,
      matched: z.boolean(),
      score: z.number().min(0).max(1),
      rationale: TextSchema,
    }),
  ),
  scores: z.object({
    relevance: z.number().min(0).max(1),
    novelty: z.number().min(0).max(1),
    importance: z.number().min(0).max(1),
    evidenceQuality: z.number().min(0).max(1),
    overall: z.number().min(0).max(1),
  }),
  confidence: z.number().min(0).max(1),
  rationale: TextSchema,
  decision: z.enum(['ACCEPT', 'REJECT', 'NEEDS_REVIEW']),
})
export type ClassificationOutput = z.infer<typeof ClassificationOutputSchema>

export const RankedCandidateInputSchema = z.object({
  paperVersionId: IdSchema,
  title: TextSchema,
  labels: z.array(TextSchema),
  classification: ClassificationOutputSchema,
})

export const ShortlistRankingInputSchema = z.object({
  candidates: z.array(RankedCandidateInputSchema).min(3),
  maximumCandidates: z.literal(4),
})
export type ShortlistRankingInput = z.infer<typeof ShortlistRankingInputSchema>

export const ShortlistOutputSchema = z.object({
  candidates: z
    .array(
      z.object({
        paperVersionId: IdSchema,
        rank: z.number().int().min(1).max(4),
        score: z.number().min(0).max(1),
        rationale: TextSchema,
        diversityContribution: TextSchema,
      }),
    )
    .min(3)
    .max(4),
  selectionNote: TextSchema,
})
export type ShortlistOutput = z.infer<typeof ShortlistOutputSchema>

export const EvidenceExtractionInputSchema = z.object({
  paperVersion: PaperVersionSchema,
  pages: z.array(DocumentPageSchema).min(1),
})
export type EvidenceExtractionInput = z.infer<
  typeof EvidenceExtractionInputSchema
>

export const ExtractedClaimSchema = z.object({
  id: IdSchema,
  text: TextSchema,
  kind: z.enum(['PAPER_FACT', 'MEASURED_RESULT', 'AUTHOR_CLAIM']),
  material: z.boolean(),
  supportStatus: z.enum(['SUPPORTED', 'CONTRADICTED', 'INSUFFICIENT_EVIDENCE']),
  evidenceSpanIds: z.array(IdSchema),
  limitation: TextSchema,
})

export const EvidenceExtractionOutputSchema = z.object({
  evidenceSpans: z.array(EvidenceSpanSchema),
  claims: z.array(ExtractedClaimSchema).min(1),
  limitations: z.array(TextSchema),
  contradictions: z.array(TextSchema),
})
export type EvidenceExtractionOutput = z.infer<
  typeof EvidenceExtractionOutputSchema
>

export const SummaryInputSchema = z.object({
  paperTitle: TextSchema,
  paperVersionId: IdSchema,
  claims: z.array(ExtractedClaimSchema).min(1),
  evidenceSpans: z.array(EvidenceSpanSchema).min(1),
})
export type SummaryInput = z.infer<typeof SummaryInputSchema>

export const SummaryOutputSchema = z.object({
  title: TextSchema,
  readingTimeMinutes: z.number().int().positive().max(15),
  sections: z.array(
    ReportSectionSchema.omit({ schemaVersion: true, id: true, reportId: true }),
  ),
  openQuestions: z.array(TextSchema),
})
export type SummaryOutput = z.infer<typeof SummaryOutputSchema>

export const ConceptMapInputSchema = SummaryInputSchema
export type ConceptMapInput = z.infer<typeof ConceptMapInputSchema>

export const ConceptMapOutputSchema = z.object({
  concepts: z.array(
    z.object({
      id: IdSchema,
      name: TextSchema,
      shortDefinition: TextSchema,
      contextualExplanation: TextSchema,
      relevance: TextSchema,
      analogy: TextSchema.nullable(),
      canonicalSource: z.url().nullable(),
      relatedConceptIds: z.array(IdSchema),
    }),
  ),
  occurrences: z.array(
    z.object({
      conceptId: IdSchema,
      evidenceSpanId: IdSchema,
      explanation: TextSchema,
    }),
  ),
})
export type ConceptMapOutput = z.infer<typeof ConceptMapOutputSchema>

export const ApprovedMarketDatumSchema = MarketMetricSchema.omit({
  schemaVersion: true,
  id: true,
  reportId: true,
})

export const MarketContextInputSchema = SummaryInputSchema.extend({
  approvedMarketData: z.array(ApprovedMarketDatumSchema),
})
export type MarketContextInput = z.infer<typeof MarketContextInputSchema>

export const MarketContextOutputSchema = z.object({
  claims: z.array(
    z.object({
      id: IdSchema,
      text: TextSchema,
      kind: ClaimKindSchema,
      evidenceSpanIds: z.array(IdSchema),
      marketDataIndexes: z.array(z.number().int().nonnegative()),
      limitation: TextSchema,
    }),
  ),
  causalChain: z.array(
    z.object({
      from: TextSchema,
      to: TextSchema,
      basis: z.enum(['PAPER_EVIDENCE', 'MARKET_DATA', 'HYPOTHESIS']),
      referenceIds: z.array(IdSchema),
    }),
  ),
})
export type MarketContextOutput = z.infer<typeof MarketContextOutputSchema>

export const IntegrityReviewInputSchema = z.object({
  paperVersion: PaperVersionSchema,
  evidence: EvidenceExtractionOutputSchema,
  summary: SummaryOutputSchema,
  concepts: ConceptMapOutputSchema,
  marketContext: MarketContextOutputSchema,
  approvedMarketData: z.array(ApprovedMarketDatumSchema),
})
export type IntegrityReviewInput = z.infer<typeof IntegrityReviewInputSchema>

export const IntegrityFindingSchema = z.object({
  code: TextSchema,
  message: TextSchema,
  recordId: IdSchema.nullable(),
})

export const IntegrityReviewOutputSchema = z
  .object({
    passed: z.boolean(),
    blockers: z.array(IntegrityFindingSchema),
    warnings: z.array(IntegrityFindingSchema),
    coverage: z.object({
      materialClaims: z.number().int().nonnegative(),
      supportedMaterialClaims: z.number().int().nonnegative(),
      evidenceReferencesChecked: z.number().int().nonnegative(),
      conceptsChecked: z.number().int().nonnegative(),
      marketClaimsChecked: z.number().int().nonnegative(),
    }),
  })
  .superRefine((review, context) => {
    if (review.passed !== (review.blockers.length === 0)) {
      context.addIssue({
        code: 'custom',
        message: 'Integrity passed must equal an empty blocker set',
        path: ['passed'],
      })
    }
  })
export type IntegrityReviewOutput = z.infer<typeof IntegrityReviewOutputSchema>

export const EditorialPackageInputSchema = z.object({
  paperVersionId: IdSchema,
  summary: SummaryOutputSchema,
  concepts: ConceptMapOutputSchema,
  marketContext: MarketContextOutputSchema,
  integrityReview: IntegrityReviewOutputSchema,
})
export type EditorialPackageInput = z.infer<typeof EditorialPackageInputSchema>

export const EditorialPackageOutputSchema = z.object({
  headline: TextSchema,
  reviewSummary: TextSchema,
  newsletterBullets: z.tuple([
    TextSchema,
    TextSchema,
    TextSchema,
    TextSchema,
    TextSchema,
  ]),
  socialPosts: z.array(TextSchema).min(1).max(5),
})
export type EditorialPackageOutput = z.infer<
  typeof EditorialPackageOutputSchema
>

export const EditorialPackageRecordSchema = z.object({
  schemaVersion: z.literal(schemaVersion),
  id: IdSchema,
  paperVersionId: IdSchema,
  workflowRunId: IdSchema,
  status: z.enum(['AWAITING_APPROVAL', 'APPROVED', 'PUBLISHED']),
  output: EditorialPackageOutputSchema,
  integrityReview: IntegrityReviewOutputSchema,
  approvedBy: IdSchema.nullable(),
  approvedAt: z.iso.datetime().nullable(),
  publishedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
})
export type EditorialPackageRecord = z.infer<
  typeof EditorialPackageRecordSchema
>

export const RuntimeWorkflowSchema = z.object({
  schemaVersion: z.literal(schemaVersion),
  id: IdSchema,
  status: z.enum([
    'CLASSIFYING',
    'SHORTLIST_READY',
    'AWAITING_SELECTION',
    'PROCESSING_SELECTED',
    'QA_BLOCKED',
    'AWAITING_PUBLICATION_APPROVAL',
    'PUBLISHED',
    'FAILED',
  ]),
  ontologyId: TextSchema,
  candidatePaperVersionIds: z.array(IdSchema),
  shortlist: ShortlistOutputSchema.nullable(),
  selectedPaperVersionId: IdSchema.nullable(),
  selectedBy: IdSchema.nullable(),
  selectedAt: z.iso.datetime().nullable(),
  agentRunIds: z.array(IdSchema),
  editorialPackageId: IdSchema.nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
export type RuntimeWorkflow = z.infer<typeof RuntimeWorkflowSchema>
