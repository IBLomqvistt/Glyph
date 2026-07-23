import {
  QuestionAnswerSchema,
  schemaVersion,
  type AiGenerationRecord,
  type Claim,
  type ConceptCard,
  type EvidenceSpan,
  type Id,
  type Paper,
  type PaperVersion,
  type PipelineRun,
  type PipelineStage,
  type QuestionAnswer,
  type Report,
  type ReportImportDiagnostic,
  type ReportPackage,
  type ReportSection,
  type UserProfile,
  type VisualSpec,
} from '@glyph/domain'

export type GlyphEdition = {
  paper: Paper
  version: PaperVersion
  report: Report
  sections: ReportSection[]
  claims: Claim[]
  evidenceSpans: EvidenceSpan[]
  concepts: ConceptCard[]
  visuals: VisualSpec[]
}

export interface PaperRepository {
  getPaper(id: Id): Promise<Paper | null>
  getVersion(id: Id): Promise<PaperVersion | null>
}

export interface ReportRepository {
  getEditionBySlug(slug: string): Promise<GlyphEdition | null>
}

export type ReportImportDraft = {
  id: Id
  originalFileName: string
  htmlSha256: string
  reportPackage: ReportPackage
  createdAt: string
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewedAt: string | null
  reviewerId: Id | null
  rejectionReason: string | null
}

export interface ReportImportStore {
  save(draft: ReportImportDraft): Promise<void>
  get(id: Id): Promise<ReportImportDraft | null>
  list(): Promise<ReportImportDraft[]>
  findApprovedBySlug(slug: string): Promise<ReportImportDraft | null>
  approve(input: {
    id: Id
    reviewerId: Id
    approvedAt: string
  }): Promise<ReportImportDraft>
  reject(input: {
    id: Id
    reviewerId: Id
    rejectedAt: string
    reason: string
  }): Promise<ReportImportDraft>
}

export type ReportImportResult = {
  draftId: Id
  previewUrl: string
  blockers: ReportImportDiagnostic[]
  warnings: ReportImportDiagnostic[]
  extractedAssetSummary: {
    inlineSvgCount: number
    tableCount: number
    unresolvedExternalAssetCount: number
  }
}

export type QuestionQuotaReservation = {
  id: Id
  reportSlug: string
  sessionId: string
  ipAddress: string
  day: string
  reservedAt: string
}

export type QuestionQuotaDecision =
  | { allowed: true; reservation: QuestionQuotaReservation }
  | {
      allowed: false
      reason: 'SESSION_DAILY_LIMIT' | 'IP_DAILY_LIMIT' | 'REQUEST_IN_PROGRESS'
      retryAfterSeconds: number
    }

export interface QuestionQuotaGateway {
  reserve(input: {
    reportSlug: string
    sessionId: string
    ipAddress: string
    now: Date
  }): Promise<QuestionQuotaDecision>
  complete(reservationId: Id): Promise<void>
  release(reservationId: Id): Promise<void>
}

export type QuestionGenerationAuditRecord = {
  id: Id
  reportSlug: string
  sessionId: string
  ipAddress: string
  model: string
  promptVersion: string
  outputSchemaVersion: number
  sourcePaperVersionId: Id
  generatedAt: string
  outcome:
    | 'ANSWER'
    | 'INSUFFICIENT_EVIDENCE'
    | 'QUOTA_EXCEEDED'
    | 'LIVE_AI_UNAVAILABLE'
    | 'FAILED'
  evidenceIds: Id[]
  latencyMs: number
  inputTokens: number | null
  outputTokens: number | null
}

export interface QuestionGenerationAuditStore {
  record(entry: QuestionGenerationAuditRecord): Promise<void>
}

export interface ConceptRepository {
  listSaved(userId: Id): Promise<ConceptCard[]>
  save(userId: Id, conceptId: Id): Promise<void>
  unsave(userId: Id, conceptId: Id): Promise<void>
}

export interface PipelineRunRepository {
  findByIdempotencyKey(key: string): Promise<PipelineRun | null>
  save(run: PipelineRun): Promise<void>
}

export interface JobRunner {
  runStage(input: {
    paperVersionId: Id
    stage: PipelineStage
    idempotencyKey: string
    effect: () => Promise<Record<string, unknown>>
  }): Promise<PipelineRun>
}

export interface PaperAssetStore {
  getPdfBytes(paperVersionId: Id): Promise<Uint8Array | null>
}

export interface AiGenerationGateway {
  classify(input: {
    title: string
    abstract: string
  }): Promise<AiGenerationRecord>
  extractEvidence(input: {
    paperVersionId: Id
    text: string
  }): Promise<AiGenerationRecord>
  synthesizeReport(input: { paperVersionId: Id }): Promise<AiGenerationRecord>
  critiqueReport(input: { reportId: Id }): Promise<AiGenerationRecord>
  answerQuestion(input: {
    reportId: Id
    question: string
    evidenceSpans: readonly EvidenceSpan[]
  }): Promise<AiGenerationRecord>
}

export const illustrationPurposes = [
  'VISUAL_ABSTRACT',
  'EDITORIAL_ACCENT',
] as const

export type IllustrationPurpose = (typeof illustrationPurposes)[number]

export type NonSemanticIllustrationBrief = {
  paperVersionId: Id
  purpose: IllustrationPurpose
  brief: string
}

export type IllustrationDraft = {
  paperVersionId: Id
  purpose: IllustrationPurpose
  model: string
  promptVersion: string
  generatedAt: string
  mimeType: 'image/png'
  imageBase64: string
  reviewStatus: 'PENDING_HUMAN_REVIEW'
  semanticUseAllowed: false
}

export interface IllustrationGenerationGateway {
  generateDraft(input: NonSemanticIllustrationBrief): Promise<IllustrationDraft>
}

export class GenerateIllustrationDraftService {
  constructor(private readonly gateway: IllustrationGenerationGateway) {}

  async execute(
    input: NonSemanticIllustrationBrief & {
      editorConfirmedNonSemanticUse: boolean
    },
  ): Promise<IllustrationDraft> {
    if (!input.editorConfirmedNonSemanticUse) {
      throw new Error('ILLUSTRATION_GENERATION_REQUIRES_EDITOR_CONFIRMATION')
    }
    if (!illustrationPurposes.includes(input.purpose)) {
      throw new Error('INVALID_ILLUSTRATION_PURPOSE')
    }
    const brief = input.brief.trim()
    if (brief.length < 12 || brief.length > 800) {
      throw new Error('ILLUSTRATION_BRIEF_LENGTH_INVALID')
    }

    const draft = await this.gateway.generateDraft({
      paperVersionId: input.paperVersionId,
      purpose: input.purpose,
      brief,
    })
    if (
      draft.reviewStatus !== 'PENDING_HUMAN_REVIEW' ||
      draft.semanticUseAllowed !== false
    ) {
      throw new Error('ILLUSTRATION_REVIEW_BOUNDARY_VIOLATED')
    }
    return draft
  }
}

export interface SubscriptionGateway {
  accessForUser(userId: Id): Promise<'PUBLIC' | 'SUBSCRIBER' | 'EDITOR'>
  createCheckoutSession(userId: Id): Promise<{ url: string }>
}

export interface AuthGateway {
  currentUser(): Promise<UserProfile>
  requireRole(role: UserProfile['role']): Promise<UserProfile>
}

export interface EmailGateway {
  previewNewsletter(reportId: Id): Promise<string>
  sendNewsletter(reportId: Id): Promise<never>
}

export interface SocialDistributionGateway {
  previewPost(reportId: Id): Promise<string>
  publishPost(reportId: Id): Promise<never>
}

export class FixtureCitedQuestionService {
  readonly #answers: QuestionAnswer[]
  readonly #evidenceIds: Set<Id>
  readonly #timestamp: string

  constructor(
    answers: readonly QuestionAnswer[],
    evidenceSpans: readonly EvidenceSpan[],
    timestamp = '2026-07-21T00:00:00.000Z',
  ) {
    this.#answers = [...answers]
    this.#evidenceIds = new Set(evidenceSpans.map((span) => span.id))
    this.#timestamp = timestamp
  }

  answerQuestion(reportId: Id, question: string): Promise<QuestionAnswer> {
    const normalizedQuestion = question.trim().toLocaleLowerCase('en')
    const candidate = this.#answers.find(
      (answer) =>
        answer.reportId === reportId &&
        answer.question.trim().toLocaleLowerCase('en') === normalizedQuestion,
    )
    if (
      candidate?.outcome === 'ANSWER' &&
      candidate.evidenceSpanIds.every((id) => this.#evidenceIds.has(id))
    ) {
      return Promise.resolve(candidate)
    }
    if (candidate?.outcome === 'INSUFFICIENT_EVIDENCE') {
      return Promise.resolve(candidate)
    }
    return Promise.resolve(
      QuestionAnswerSchema.parse({
        schemaVersion,
        id: `answer-insufficient-${stableTextHash(normalizedQuestion)}`,
        reportId,
        question: question.trim(),
        outcome: 'INSUFFICIENT_EVIDENCE',
        answerText: null,
        evidenceSpanIds: [],
        generatedAt: this.#timestamp,
        validatedAt: this.#timestamp,
      }),
    )
  }
}

function stableTextHash(value: string): string {
  let hash = 2166136261
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export class InMemoryReportRepository implements ReportRepository {
  readonly #editions: Map<string, GlyphEdition>

  constructor(editions: readonly GlyphEdition[]) {
    this.#editions = new Map(
      editions.map((edition) => [edition.report.slug, edition]),
    )
  }

  getEditionBySlug(slug: string): Promise<GlyphEdition | null> {
    return Promise.resolve(this.#editions.get(slug) ?? null)
  }
}

export class InMemoryPaperRepository implements PaperRepository {
  readonly #papers: Map<Id, Paper>
  readonly #versions: Map<Id, PaperVersion>

  constructor(papers: readonly Paper[], versions: readonly PaperVersion[]) {
    this.#papers = new Map(papers.map((paper) => [paper.id, paper]))
    this.#versions = new Map(versions.map((version) => [version.id, version]))
  }

  getPaper(id: Id): Promise<Paper | null> {
    return Promise.resolve(this.#papers.get(id) ?? null)
  }

  getVersion(id: Id): Promise<PaperVersion | null> {
    return Promise.resolve(this.#versions.get(id) ?? null)
  }
}

export class InMemoryConceptRepository implements ConceptRepository {
  readonly #concepts: Map<Id, ConceptCard>
  readonly #saved = new Map<Id, Set<Id>>()

  constructor(concepts: readonly ConceptCard[]) {
    this.#concepts = new Map(concepts.map((concept) => [concept.id, concept]))
  }

  listSaved(userId: Id): Promise<ConceptCard[]> {
    const ids = this.#saved.get(userId) ?? new Set<Id>()
    return Promise.resolve(
      [...ids]
        .map((id) => this.#concepts.get(id))
        .filter((concept): concept is ConceptCard => concept !== undefined),
    )
  }

  save(userId: Id, conceptId: Id): Promise<void> {
    if (!this.#concepts.has(conceptId)) {
      return Promise.reject(new Error(`Unknown concept: ${conceptId}`))
    }
    const saved = this.#saved.get(userId) ?? new Set<Id>()
    saved.add(conceptId)
    this.#saved.set(userId, saved)
    return Promise.resolve()
  }

  unsave(userId: Id, conceptId: Id): Promise<void> {
    this.#saved.get(userId)?.delete(conceptId)
    return Promise.resolve()
  }
}

export class InMemoryPipelineRunRepository implements PipelineRunRepository {
  readonly #runs = new Map<string, PipelineRun>()

  findByIdempotencyKey(key: string): Promise<PipelineRun | null> {
    return Promise.resolve(this.#runs.get(key) ?? null)
  }

  save(run: PipelineRun): Promise<void> {
    this.#runs.set(run.idempotencyKey, run)
    return Promise.resolve()
  }
}
