import { asc, desc, eq } from 'drizzle-orm'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import type { GlyphEdition, RuntimeRepository } from '@glyph/application'
import {
  ClaimSchema,
  ConceptCardSchema,
  EvidenceSpanSchema,
  MarketMetricSchema,
  PaperSchema,
  PaperVersionSchema,
  PipelineRunSchema,
  ReportSchema,
  ReportSectionSchema,
  SourceAuditEventSchema,
  SourceRegistryEntrySchema,
  VisualSpecSchema,
  type Id,
  type Paper,
  type PaperVersion,
  type PipelineRun,
  type SourceAuditEvent,
  type SourceRegistryEntry,
} from '@glyph/domain'
import {
  AgentRunEnvelopeSchema,
  EditorialPackageRecordSchema,
  IngestedDocumentSchema,
  PaperLabelOntologySchema,
  RuntimeWorkflowSchema,
  SourceScanSchema,
  type AgentRunEnvelope,
  type EditorialPackageRecord,
  type IngestedDocument,
  type PaperLabelOntology,
  type RuntimeWorkflow,
  type SourceScan,
} from '@glyph/domain/runtime-agents'

import {
  agentRuns,
  editorialPackages,
  ingestedDocuments,
  paperLabelOntologies,
  paperVersions,
  papers,
  pipelineRuns,
  reports,
  runtimeWorkflows,
  sourceAuditEvents,
  sources,
  sourceScans,
} from './schema.js'

function parseArray<T>(
  value: unknown,
  parse: (item: unknown) => T,
  field: string,
): T[] {
  if (!Array.isArray(value)) {
    throw new TypeError(`Stored edition field ${field} must be an array`)
  }
  return value.map(parse)
}

function parseEdition(value: unknown): GlyphEdition {
  if (typeof value !== 'object' || value === null) {
    throw new TypeError('Stored edition payload must be an object')
  }
  const edition = value as Record<string, unknown>
  return {
    paper: PaperSchema.parse(edition.paper),
    version: PaperVersionSchema.parse(edition.version),
    report: ReportSchema.parse(edition.report),
    sections: parseArray(
      edition.sections,
      (item) => ReportSectionSchema.parse(item),
      'sections',
    ),
    claims: parseArray(
      edition.claims,
      (item) => ClaimSchema.parse(item),
      'claims',
    ),
    evidenceSpans: parseArray(
      edition.evidenceSpans,
      (item) => EvidenceSpanSchema.parse(item),
      'evidenceSpans',
    ),
    concepts: parseArray(
      edition.concepts,
      (item) => ConceptCardSchema.parse(item),
      'concepts',
    ),
    visuals: parseArray(
      edition.visuals,
      (item) => VisualSpecSchema.parse(item),
      'visuals',
    ),
    marketMetrics: parseArray(
      edition.marketMetrics,
      (item) => MarketMetricSchema.parse(item),
      'marketMetrics',
    ),
  }
}

export class InMemoryGlyphRepository implements RuntimeRepository {
  readonly #sources = new Map<Id, SourceRegistryEntry>()
  readonly #sourceAudit: SourceAuditEvent[] = []
  readonly #papers = new Map<Id, Paper>()
  readonly #versions = new Map<Id, PaperVersion>()
  readonly #editionsBySlug = new Map<string, GlyphEdition>()
  readonly #editionsByReportId = new Map<Id, GlyphEdition>()
  readonly #pipelineRuns = new Map<string, PipelineRun>()
  readonly #ingestedDocuments = new Map<string, IngestedDocument>()
  readonly #sourceScans = new Map<Id, SourceScan>()
  readonly #paperLabelOntologies = new Map<string, PaperLabelOntology>()
  readonly #agentRuns = new Map<Id, AgentRunEnvelope>()
  readonly #runtimeWorkflows = new Map<Id, RuntimeWorkflow>()
  readonly #editorialPackages = new Map<Id, EditorialPackageRecord>()

  healthCheck(): Promise<void> {
    return Promise.resolve()
  }

  listSources(): Promise<SourceRegistryEntry[]> {
    return Promise.resolve(
      [...this.#sources.values()].sort((a, b) => b.priority - a.priority),
    )
  }

  getSource(id: Id): Promise<SourceRegistryEntry | null> {
    return Promise.resolve(this.#sources.get(id) ?? null)
  }

  saveSource(source: SourceRegistryEntry): Promise<void> {
    this.#sources.set(source.id, structuredClone(source))
    return Promise.resolve()
  }

  appendSourceAudit(event: SourceAuditEvent): Promise<void> {
    this.#sourceAudit.push(structuredClone(event))
    return Promise.resolve()
  }

  listSourceAudit(sourceId: Id): Promise<SourceAuditEvent[]> {
    return Promise.resolve(
      this.#sourceAudit
        .filter((event) => event.sourceId === sourceId)
        .map((event) => structuredClone(event)),
    )
  }

  getPaper(id: Id): Promise<Paper | null> {
    return Promise.resolve(this.#papers.get(id) ?? null)
  }

  savePaper(paper: Paper): Promise<void> {
    this.#papers.set(paper.id, structuredClone(paper))
    return Promise.resolve()
  }

  getPaperVersion(id: Id): Promise<PaperVersion | null> {
    return Promise.resolve(this.#versions.get(id) ?? null)
  }

  savePaperVersion(version: PaperVersion): Promise<void> {
    this.#versions.set(version.id, structuredClone(version))
    return Promise.resolve()
  }

  getEditionBySlug(slug: string): Promise<GlyphEdition | null> {
    return Promise.resolve(this.#editionsBySlug.get(slug) ?? null)
  }

  getEditionByReportId(reportId: Id): Promise<GlyphEdition | null> {
    return Promise.resolve(this.#editionsByReportId.get(reportId) ?? null)
  }

  saveEdition(edition: GlyphEdition): Promise<void> {
    const clone = structuredClone(edition)
    this.#papers.set(clone.paper.id, clone.paper)
    this.#versions.set(clone.version.id, clone.version)
    this.#editionsBySlug.set(clone.report.slug, clone)
    this.#editionsByReportId.set(clone.report.id, clone)
    return Promise.resolve()
  }

  findPipelineRun(idempotencyKey: string): Promise<PipelineRun | null> {
    return Promise.resolve(this.#pipelineRuns.get(idempotencyKey) ?? null)
  }

  savePipelineRun(run: PipelineRun): Promise<void> {
    this.#pipelineRuns.set(run.idempotencyKey, structuredClone(run))
    return Promise.resolve()
  }

  findIngestedDocument(fingerprint: string): Promise<IngestedDocument | null> {
    return Promise.resolve(
      [...this.#ingestedDocuments.values()].find(
        (document) => document.fingerprint === fingerprint,
      ) ?? null,
    )
  }

  getIngestedDocumentByPaperVersion(
    paperVersionId: Id,
  ): Promise<IngestedDocument | null> {
    return Promise.resolve(
      [...this.#ingestedDocuments.values()].find(
        (document) => document.paperVersionId === paperVersionId,
      ) ?? null,
    )
  }

  saveIngestedDocument(document: IngestedDocument): Promise<boolean> {
    if (
      [...this.#ingestedDocuments.values()].some(
        (existing) => existing.fingerprint === document.fingerprint,
      )
    ) {
      return Promise.resolve(false)
    }
    this.#ingestedDocuments.set(document.id, structuredClone(document))
    return Promise.resolve(true)
  }

  getSourceScan(id: Id): Promise<SourceScan | null> {
    return Promise.resolve(this.#sourceScans.get(id) ?? null)
  }

  saveSourceScan(scan: SourceScan): Promise<void> {
    this.#sourceScans.set(scan.id, structuredClone(scan))
    return Promise.resolve()
  }

  getPaperLabelOntology(id: string): Promise<PaperLabelOntology | null> {
    return Promise.resolve(this.#paperLabelOntologies.get(id) ?? null)
  }

  savePaperLabelOntology(ontology: PaperLabelOntology): Promise<void> {
    this.#paperLabelOntologies.set(ontology.id, structuredClone(ontology))
    return Promise.resolve()
  }

  getAgentRun(id: Id): Promise<AgentRunEnvelope | null> {
    return Promise.resolve(this.#agentRuns.get(id) ?? null)
  }

  listAgentRuns(runId: Id): Promise<AgentRunEnvelope[]> {
    return Promise.resolve(
      [...this.#agentRuns.values()]
        .filter((run) => run.runId === runId)
        .map((run) => structuredClone(run)),
    )
  }

  saveAgentRun(run: AgentRunEnvelope): Promise<void> {
    this.#agentRuns.set(run.id, structuredClone(run))
    return Promise.resolve()
  }

  getRuntimeWorkflow(id: Id): Promise<RuntimeWorkflow | null> {
    return Promise.resolve(this.#runtimeWorkflows.get(id) ?? null)
  }

  saveRuntimeWorkflow(workflow: RuntimeWorkflow): Promise<void> {
    this.#runtimeWorkflows.set(workflow.id, structuredClone(workflow))
    return Promise.resolve()
  }

  getEditorialPackage(id: Id): Promise<EditorialPackageRecord | null> {
    return Promise.resolve(this.#editorialPackages.get(id) ?? null)
  }

  saveEditorialPackage(record: EditorialPackageRecord): Promise<void> {
    this.#editorialPackages.set(record.id, structuredClone(record))
    return Promise.resolve()
  }
}

export class PostgresGlyphRepository implements RuntimeRepository {
  constructor(
    private readonly pool: Pool,
    private readonly database: NodePgDatabase = drizzle(pool),
  ) {}

  async healthCheck(): Promise<void> {
    await this.pool.query('select 1')
  }

  async listSources(): Promise<SourceRegistryEntry[]> {
    const rows = await this.database
      .select()
      .from(sources)
      .orderBy(desc(sources.priority))
    return rows.map((row) => SourceRegistryEntrySchema.parse(row.payload))
  }

  async getSource(id: Id): Promise<SourceRegistryEntry | null> {
    const [row] = await this.database
      .select()
      .from(sources)
      .where(eq(sources.id, id))
      .limit(1)
    return row === undefined
      ? null
      : SourceRegistryEntrySchema.parse(row.payload)
  }

  async saveSource(source: SourceRegistryEntry): Promise<void> {
    await this.database
      .insert(sources)
      .values({
        id: source.id,
        schemaVersion: source.schemaVersion,
        name: source.name,
        kind: source.kind,
        baseUrl: source.baseUrl,
        enabled: source.enabled,
        priority: source.priority,
        rights: source.rights,
        connectorKey: source.connectorKey,
        payload: source,
        createdAt: new Date(source.createdAt),
        updatedAt: new Date(source.updatedAt),
      })
      .onConflictDoUpdate({
        target: sources.id,
        set: {
          name: source.name,
          kind: source.kind,
          baseUrl: source.baseUrl,
          enabled: source.enabled,
          priority: source.priority,
          rights: source.rights,
          connectorKey: source.connectorKey,
          payload: source,
          updatedAt: new Date(source.updatedAt),
        },
      })
  }

  async appendSourceAudit(event: SourceAuditEvent): Promise<void> {
    await this.database.insert(sourceAuditEvents).values({
      id: event.id,
      schemaVersion: event.schemaVersion,
      sourceId: event.sourceId,
      actorId: event.actorId,
      action: event.action,
      outcome: event.outcome,
      detail: event.detail,
      occurredAt: new Date(event.occurredAt),
      payload: event,
    })
  }

  async listSourceAudit(sourceId: Id): Promise<SourceAuditEvent[]> {
    const rows = await this.database
      .select()
      .from(sourceAuditEvents)
      .where(eq(sourceAuditEvents.sourceId, sourceId))
      .orderBy(asc(sourceAuditEvents.occurredAt))
    return rows.map((row) => SourceAuditEventSchema.parse(row.payload))
  }

  async getPaper(id: Id): Promise<Paper | null> {
    const [row] = await this.database
      .select()
      .from(papers)
      .where(eq(papers.id, id))
      .limit(1)
    return row === undefined ? null : PaperSchema.parse(row.payload)
  }

  async savePaper(paper: Paper): Promise<void> {
    await this.database
      .insert(papers)
      .values({
        id: paper.id,
        schemaVersion: paper.schemaVersion,
        sourceId: paper.sourceId,
        title: paper.title,
        canonicalUrl: paper.canonicalUrl,
        payload: paper,
      })
      .onConflictDoUpdate({
        target: papers.id,
        set: { title: paper.title, payload: paper },
      })
  }

  async getPaperVersion(id: Id): Promise<PaperVersion | null> {
    const [row] = await this.database
      .select()
      .from(paperVersions)
      .where(eq(paperVersions.id, id))
      .limit(1)
    return row === undefined ? null : PaperVersionSchema.parse(row.payload)
  }

  async savePaperVersion(version: PaperVersion): Promise<void> {
    await this.database
      .insert(paperVersions)
      .values({
        id: version.id,
        schemaVersion: version.schemaVersion,
        paperId: version.paperId,
        checksumSha256: version.checksumSha256,
        versionLabel: version.versionLabel,
        licenceStatus: version.licenceStatus,
        publicationDate: version.publicationDate,
        revisionDate: version.revisionDate,
        pageCount: version.pageCount,
        assetReference: version.assetReference,
        payload: version,
      })
      .onConflictDoUpdate({
        target: paperVersions.id,
        set: { versionLabel: version.versionLabel, payload: version },
      })
  }

  async getEditionBySlug(slug: string): Promise<GlyphEdition | null> {
    const [row] = await this.database
      .select()
      .from(reports)
      .where(eq(reports.slug, slug))
      .limit(1)
    return row === undefined ? null : parseEdition(structuredClone(row.payload))
  }

  async getEditionByReportId(reportId: Id): Promise<GlyphEdition | null> {
    const [row] = await this.database
      .select()
      .from(reports)
      .where(eq(reports.id, reportId))
      .limit(1)
    return row === undefined ? null : parseEdition(structuredClone(row.payload))
  }

  async saveEdition(edition: GlyphEdition): Promise<void> {
    await this.database.transaction(async (transaction) => {
      await transaction
        .insert(papers)
        .values({
          id: edition.paper.id,
          schemaVersion: edition.paper.schemaVersion,
          sourceId: edition.paper.sourceId,
          title: edition.paper.title,
          canonicalUrl: edition.paper.canonicalUrl,
          payload: edition.paper,
        })
        .onConflictDoUpdate({
          target: papers.id,
          set: {
            title: edition.paper.title,
            canonicalUrl: edition.paper.canonicalUrl,
            payload: edition.paper,
          },
        })

      await transaction
        .insert(paperVersions)
        .values({
          id: edition.version.id,
          schemaVersion: edition.version.schemaVersion,
          paperId: edition.version.paperId,
          checksumSha256: edition.version.checksumSha256,
          versionLabel: edition.version.versionLabel,
          licenceStatus: edition.version.licenceStatus,
          publicationDate: edition.version.publicationDate,
          revisionDate: edition.version.revisionDate,
          pageCount: edition.version.pageCount,
          assetReference: edition.version.assetReference,
          payload: edition.version,
        })
        .onConflictDoUpdate({
          target: paperVersions.id,
          set: {
            versionLabel: edition.version.versionLabel,
            licenceStatus: edition.version.licenceStatus,
            revisionDate: edition.version.revisionDate,
            pageCount: edition.version.pageCount,
            assetReference: edition.version.assetReference,
            payload: edition.version,
          },
        })

      await transaction
        .insert(reports)
        .values({
          id: edition.report.id,
          schemaVersion: edition.report.schemaVersion,
          paperVersionId: edition.report.paperVersionId,
          slug: edition.report.slug,
          status: edition.report.status,
          readingTimeMinutes: edition.report.readingTimeMinutes,
          payload: edition,
          createdAt: new Date(edition.report.createdAt),
          updatedAt: new Date(edition.report.updatedAt),
          editorApprovedAt:
            edition.report.editorApproval === null
              ? null
              : new Date(edition.report.editorApproval.approvedAt),
        })
        .onConflictDoUpdate({
          target: reports.id,
          set: {
            status: edition.report.status,
            readingTimeMinutes: edition.report.readingTimeMinutes,
            payload: edition,
            updatedAt: new Date(edition.report.updatedAt),
            editorApprovedAt:
              edition.report.editorApproval === null
                ? null
                : new Date(edition.report.editorApproval.approvedAt),
          },
        })
    })
  }

  async findPipelineRun(idempotencyKey: string): Promise<PipelineRun | null> {
    const [row] = await this.database
      .select()
      .from(pipelineRuns)
      .where(eq(pipelineRuns.idempotencyKey, idempotencyKey))
      .limit(1)
    return row === undefined ? null : PipelineRunSchema.parse(row.payload)
  }

  async savePipelineRun(run: PipelineRun): Promise<void> {
    await this.database
      .insert(pipelineRuns)
      .values({
        id: run.id,
        schemaVersion: run.schemaVersion,
        paperVersionId: run.paperVersionId,
        stage: run.stage,
        attempt: run.attempt,
        idempotencyKey: run.idempotencyKey,
        status: run.status,
        result: run.result,
        error: run.error,
        createdAt: new Date(run.createdAt),
        updatedAt: new Date(run.updatedAt),
        payload: run,
      })
      .onConflictDoUpdate({
        target: pipelineRuns.idempotencyKey,
        set: {
          attempt: run.attempt,
          status: run.status,
          result: run.result,
          error: run.error,
          updatedAt: new Date(run.updatedAt),
          payload: run,
        },
      })
  }

  async findIngestedDocument(
    fingerprint: string,
  ): Promise<IngestedDocument | null> {
    const [row] = await this.database
      .select()
      .from(ingestedDocuments)
      .where(eq(ingestedDocuments.fingerprint, fingerprint))
      .limit(1)
    return row === undefined ? null : IngestedDocumentSchema.parse(row.payload)
  }

  async getIngestedDocumentByPaperVersion(
    paperVersionId: Id,
  ): Promise<IngestedDocument | null> {
    const [row] = await this.database
      .select()
      .from(ingestedDocuments)
      .where(eq(ingestedDocuments.paperVersionId, paperVersionId))
      .limit(1)
    return row === undefined ? null : IngestedDocumentSchema.parse(row.payload)
  }

  async saveIngestedDocument(document: IngestedDocument): Promise<boolean> {
    const inserted = await this.database
      .insert(ingestedDocuments)
      .values({
        id: document.id,
        fingerprint: document.fingerprint,
        sourceId: document.sourceId,
        paperVersionId: document.paperVersionId,
        eligibility: document.eligibility,
        payload: document,
        createdAt: new Date(document.ingestedAt),
      })
      .onConflictDoNothing({ target: ingestedDocuments.fingerprint })
      .returning({ id: ingestedDocuments.id })
    return inserted.length === 1
  }

  async getSourceScan(id: Id): Promise<SourceScan | null> {
    const [row] = await this.database
      .select()
      .from(sourceScans)
      .where(eq(sourceScans.id, id))
      .limit(1)
    return row === undefined ? null : SourceScanSchema.parse(row.payload)
  }

  async saveSourceScan(scan: SourceScan): Promise<void> {
    await this.database
      .insert(sourceScans)
      .values({
        id: scan.id,
        trigger: scan.trigger,
        status: scan.status,
        payload: scan,
        startedAt: new Date(scan.startedAt),
        completedAt:
          scan.completedAt === null ? null : new Date(scan.completedAt),
      })
      .onConflictDoUpdate({
        target: sourceScans.id,
        set: {
          status: scan.status,
          payload: scan,
          completedAt:
            scan.completedAt === null ? null : new Date(scan.completedAt),
        },
      })
  }

  async getPaperLabelOntology(id: string): Promise<PaperLabelOntology | null> {
    const [row] = await this.database
      .select()
      .from(paperLabelOntologies)
      .where(eq(paperLabelOntologies.id, id))
      .limit(1)
    return row === undefined
      ? null
      : PaperLabelOntologySchema.parse(row.payload)
  }

  async savePaperLabelOntology(ontology: PaperLabelOntology): Promise<void> {
    await this.database
      .insert(paperLabelOntologies)
      .values({
        id: ontology.id,
        version: ontology.version,
        status: ontology.status,
        payload: ontology,
        approvedAt:
          ontology.approvedAt === null ? null : new Date(ontology.approvedAt),
      })
      .onConflictDoUpdate({
        target: paperLabelOntologies.id,
        set: {
          version: ontology.version,
          status: ontology.status,
          payload: ontology,
          approvedAt:
            ontology.approvedAt === null ? null : new Date(ontology.approvedAt),
        },
      })
  }

  async getAgentRun(id: Id): Promise<AgentRunEnvelope | null> {
    const [row] = await this.database
      .select()
      .from(agentRuns)
      .where(eq(agentRuns.id, id))
      .limit(1)
    return row === undefined ? null : AgentRunEnvelopeSchema.parse(row.payload)
  }

  async listAgentRuns(runId: Id): Promise<AgentRunEnvelope[]> {
    const rows = await this.database
      .select()
      .from(agentRuns)
      .where(eq(agentRuns.runId, runId))
      .orderBy(asc(agentRuns.startedAt))
    return rows.map((row) => AgentRunEnvelopeSchema.parse(row.payload))
  }

  async saveAgentRun(run: AgentRunEnvelope): Promise<void> {
    await this.database
      .insert(agentRuns)
      .values({
        id: run.id,
        runId: run.runId,
        paperVersionId: run.paperVersionId,
        agent: run.agent,
        status: run.status,
        payload: run,
        startedAt: new Date(run.startedAt),
        completedAt:
          run.completedAt === null ? null : new Date(run.completedAt),
      })
      .onConflictDoUpdate({
        target: agentRuns.id,
        set: {
          status: run.status,
          payload: run,
          completedAt:
            run.completedAt === null ? null : new Date(run.completedAt),
        },
      })
  }

  async getRuntimeWorkflow(id: Id): Promise<RuntimeWorkflow | null> {
    const [row] = await this.database
      .select()
      .from(runtimeWorkflows)
      .where(eq(runtimeWorkflows.id, id))
      .limit(1)
    return row === undefined ? null : RuntimeWorkflowSchema.parse(row.payload)
  }

  async saveRuntimeWorkflow(workflow: RuntimeWorkflow): Promise<void> {
    await this.database
      .insert(runtimeWorkflows)
      .values({
        id: workflow.id,
        status: workflow.status,
        selectedPaperVersionId: workflow.selectedPaperVersionId,
        editorialPackageId: workflow.editorialPackageId,
        payload: workflow,
        createdAt: new Date(workflow.createdAt),
        updatedAt: new Date(workflow.updatedAt),
      })
      .onConflictDoUpdate({
        target: runtimeWorkflows.id,
        set: {
          status: workflow.status,
          selectedPaperVersionId: workflow.selectedPaperVersionId,
          editorialPackageId: workflow.editorialPackageId,
          payload: workflow,
          updatedAt: new Date(workflow.updatedAt),
        },
      })
  }

  async getEditorialPackage(id: Id): Promise<EditorialPackageRecord | null> {
    const [row] = await this.database
      .select()
      .from(editorialPackages)
      .where(eq(editorialPackages.id, id))
      .limit(1)
    return row === undefined
      ? null
      : EditorialPackageRecordSchema.parse(row.payload)
  }

  async saveEditorialPackage(record: EditorialPackageRecord): Promise<void> {
    await this.database
      .insert(editorialPackages)
      .values({
        id: record.id,
        paperVersionId: record.paperVersionId,
        workflowRunId: record.workflowRunId,
        status: record.status,
        payload: record,
        createdAt: new Date(record.createdAt),
        approvedAt:
          record.approvedAt === null ? null : new Date(record.approvedAt),
        publishedAt:
          record.publishedAt === null ? null : new Date(record.publishedAt),
      })
      .onConflictDoUpdate({
        target: editorialPackages.id,
        set: {
          status: record.status,
          payload: record,
          approvedAt:
            record.approvedAt === null ? null : new Date(record.approvedAt),
          publishedAt:
            record.publishedAt === null ? null : new Date(record.publishedAt),
        },
      })
  }
}

export function createPostgresRepository(connectionString: string): {
  repository: PostgresGlyphRepository
  close: () => Promise<void>
} {
  const pool = new Pool({ connectionString, max: 10 })
  return {
    repository: new PostgresGlyphRepository(pool),
    close: () => pool.end(),
  }
}

export * from './schema.js'
