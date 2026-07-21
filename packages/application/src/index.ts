import {
  PipelineRunSchema,
  SourceAuditEventSchema,
  SourceRegistryEntrySchema,
  publicationBlockers,
  schemaVersion,
  type Claim,
  type ConceptCard,
  type EvidenceSpan,
  type Id,
  type MarketMetric,
  type Paper,
  type PaperVersion,
  type PipelineRun,
  type PipelineStage,
  type PublicationInput,
  type Report,
  type ReportSection,
  type SourceAuditEvent,
  type SourceRegistryEntry,
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
  marketMetrics: MarketMetric[]
}

export interface GlyphRepository {
  healthCheck(): Promise<void>

  listSources(): Promise<SourceRegistryEntry[]>
  getSource(id: Id): Promise<SourceRegistryEntry | null>
  saveSource(source: SourceRegistryEntry): Promise<void>
  appendSourceAudit(event: SourceAuditEvent): Promise<void>
  listSourceAudit(sourceId: Id): Promise<SourceAuditEvent[]>

  getPaper(id: Id): Promise<Paper | null>
  savePaper(paper: Paper): Promise<void>
  getPaperVersion(id: Id): Promise<PaperVersion | null>
  savePaperVersion(version: PaperVersion): Promise<void>

  getEditionBySlug(slug: string): Promise<GlyphEdition | null>
  getEditionByReportId(reportId: Id): Promise<GlyphEdition | null>
  saveEdition(edition: GlyphEdition): Promise<void>

  findPipelineRun(idempotencyKey: string): Promise<PipelineRun | null>
  savePipelineRun(run: PipelineRun): Promise<void>
}

export interface SourceConnectorTester {
  test(source: SourceRegistryEntry): Promise<{ ok: boolean; detail: string }>
}

export interface StageExecutor {
  execute(input: {
    paperVersionId: Id
    stage: PipelineStage
  }): Promise<Record<string, unknown>>
}

export type Clock = () => string
export type IdFactory = (prefix: string) => string

const defaultClock: Clock = () => new Date().toISOString()
const defaultIdFactory: IdFactory = (prefix) =>
  `${prefix}-${crypto.randomUUID()}`

export class SourceRegistryService {
  constructor(
    private readonly repository: GlyphRepository,
    private readonly connectorTester: SourceConnectorTester,
    private readonly clock: Clock = defaultClock,
    private readonly ids: IdFactory = defaultIdFactory,
  ) {}

  list(): Promise<SourceRegistryEntry[]> {
    return this.repository.listSources()
  }

  audit(sourceId: Id): Promise<SourceAuditEvent[]> {
    return this.repository.listSourceAudit(sourceId)
  }

  async create(
    input: Omit<
      SourceRegistryEntry,
      'schemaVersion' | 'id' | 'createdAt' | 'updatedAt'
    >,
    actorId: Id,
  ): Promise<SourceRegistryEntry> {
    const timestamp = this.clock()
    const source = SourceRegistryEntrySchema.parse({
      ...input,
      schemaVersion,
      id: this.ids('source'),
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    await this.repository.saveSource(source)
    await this.recordAudit(
      source.id,
      actorId,
      'CREATED',
      'SUCCEEDED',
      'Source created',
    )
    return source
  }

  async setEnabled(
    sourceId: Id,
    enabled: boolean,
    actorId: Id,
  ): Promise<SourceRegistryEntry> {
    const existing = await this.repository.getSource(sourceId)
    if (existing === null) {
      throw new ApplicationError(
        'SOURCE_NOT_FOUND',
        `Unknown source ${sourceId}`,
        404,
      )
    }
    const updated = SourceRegistryEntrySchema.parse({
      ...existing,
      enabled,
      updatedAt: this.clock(),
    })
    await this.repository.saveSource(updated)
    await this.recordAudit(
      sourceId,
      actorId,
      enabled ? 'ENABLED' : 'DISABLED',
      'SUCCEEDED',
      enabled ? 'Source enabled' : 'Source disabled',
    )
    return updated
  }

  async test(
    sourceId: Id,
    actorId: Id,
  ): Promise<{ ok: boolean; detail: string }> {
    const source = await this.repository.getSource(sourceId)
    if (source === null) {
      throw new ApplicationError(
        'SOURCE_NOT_FOUND',
        `Unknown source ${sourceId}`,
        404,
      )
    }
    const result = await this.connectorTester.test(source)
    await this.recordAudit(
      sourceId,
      actorId,
      'TESTED',
      result.ok ? 'SUCCEEDED' : 'FAILED',
      result.detail,
    )
    return result
  }

  private async recordAudit(
    sourceId: Id,
    actorId: Id,
    action: SourceAuditEvent['action'],
    outcome: SourceAuditEvent['outcome'],
    detail: string,
  ): Promise<void> {
    await this.repository.appendSourceAudit(
      SourceAuditEventSchema.parse({
        schemaVersion,
        id: this.ids('audit'),
        sourceId,
        actorId,
        action,
        outcome,
        detail,
        occurredAt: this.clock(),
      }),
    )
  }
}

export class PipelineService {
  constructor(
    private readonly repository: GlyphRepository,
    private readonly executor: StageExecutor,
    private readonly clock: Clock = defaultClock,
    private readonly ids: IdFactory = defaultIdFactory,
  ) {}

  async run(input: {
    paperVersionId: Id
    stage: PipelineStage
    idempotencyKey: string
  }): Promise<PipelineRun> {
    const existing = await this.repository.findPipelineRun(input.idempotencyKey)
    if (existing?.status === 'SUCCEEDED' || existing?.status === 'RUNNING') {
      return existing
    }

    const timestamp = this.clock()
    const running = PipelineRunSchema.parse({
      schemaVersion,
      id: existing?.id ?? this.ids('run'),
      paperVersionId: input.paperVersionId,
      stage: input.stage,
      attempt: (existing?.attempt ?? 0) + 1,
      idempotencyKey: input.idempotencyKey,
      status: 'RUNNING',
      result: null,
      error: null,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    })
    await this.repository.savePipelineRun(running)

    try {
      const result = await this.executor.execute(input)
      const succeeded = PipelineRunSchema.parse({
        ...running,
        status: 'SUCCEEDED',
        result,
        updatedAt: this.clock(),
      })
      await this.repository.savePipelineRun(succeeded)
      return succeeded
    } catch (error) {
      const failed = PipelineRunSchema.parse({
        ...running,
        status: 'FAILED',
        error: {
          code: 'STAGE_FAILED',
          message:
            error instanceof Error ? error.message : 'Unknown stage failure',
        },
        updatedAt: this.clock(),
      })
      await this.repository.savePipelineRun(failed)
      return failed
    }
  }
}

export class EditorialService {
  constructor(
    private readonly repository: GlyphRepository,
    private readonly clock: Clock = defaultClock,
  ) {}

  async approve(input: {
    reportId: Id
    editorId: Id
    integrityReview: PublicationInput['integrityReview']
  }): Promise<Report> {
    const edition = await this.requireEdition(input.reportId)
    const timestamp = this.clock()
    const candidate: Report = {
      ...edition.report,
      status: 'APPROVED',
      updatedAt: timestamp,
      editorApproval: { editorId: input.editorId, approvedAt: timestamp },
    }
    const blockers = publicationBlockers({
      report: candidate,
      paperVersion: edition.version,
      claims: edition.claims,
      evidenceSpans: edition.evidenceSpans,
      visuals: edition.visuals,
      marketMetrics: edition.marketMetrics,
      integrityReview: input.integrityReview,
    })
    if (blockers.length > 0) {
      throw new ApplicationError(
        'PUBLICATION_BLOCKED',
        'Report cannot be approved while integrity blockers remain',
        409,
        blockers,
      )
    }
    await this.repository.saveEdition({ ...edition, report: candidate })
    return candidate
  }

  async publish(input: {
    reportId: Id
    integrityReview: PublicationInput['integrityReview']
  }): Promise<Report> {
    const edition = await this.requireEdition(input.reportId)
    const blockers = publicationBlockers({
      report: edition.report,
      paperVersion: edition.version,
      claims: edition.claims,
      evidenceSpans: edition.evidenceSpans,
      visuals: edition.visuals,
      marketMetrics: edition.marketMetrics,
      integrityReview: input.integrityReview,
    })
    if (blockers.length > 0) {
      throw new ApplicationError(
        'PUBLICATION_BLOCKED',
        'Report cannot be published while blockers remain',
        409,
        blockers,
      )
    }
    const published: Report = {
      ...edition.report,
      status: 'PUBLISHED',
      updatedAt: this.clock(),
    }
    await this.repository.saveEdition({ ...edition, report: published })
    return published
  }

  private async requireEdition(reportId: Id): Promise<GlyphEdition> {
    const edition = await this.repository.getEditionByReportId(reportId)
    if (edition === null) {
      throw new ApplicationError(
        'REPORT_NOT_FOUND',
        `Unknown report ${reportId}`,
        404,
      )
    }
    return edition
  }
}

export class ApplicationError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly statusCode: number,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ApplicationError'
  }
}

export class DeferredConnectorTester implements SourceConnectorTester {
  test(source: SourceRegistryEntry): Promise<{ ok: boolean; detail: string }> {
    return Promise.resolve({
      ok: false,
      detail: `Connector ${source.connectorKey} is not configured; live source access is deferred`,
    })
  }
}

export class DeferredStageExecutor implements StageExecutor {
  execute(input: {
    paperVersionId: Id
    stage: PipelineStage
  }): Promise<Record<string, unknown>> {
    if (['PUBLISH', 'DISTRIBUTE'].includes(input.stage)) {
      return Promise.reject(
        new Error(`${input.stage} requires an approved provider configuration`),
      )
    }
    return Promise.resolve({
      deferred: true,
      stage: input.stage,
      paperVersionId: input.paperVersionId,
    })
  }
}

export * from './runtime-agents.js'
