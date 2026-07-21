import { createHash } from 'node:crypto'

import {
  PaperSchema,
  PaperVersionSchema,
  SourceRegistryEntrySchema,
  schemaVersion,
  type Id,
  type Paper,
  type SourceRegistryEntry,
} from '@glyph/domain'
import {
  AgentRunEnvelopeSchema,
  EditorialPackageRecordSchema,
  IngestedDocumentSchema,
  PaperLabelOntologySchema,
  RuntimeWorkflowSchema,
  SourceDocumentSchema,
  SourceScanSchema,
  type AgentRunEnvelope,
  type ClassificationInput,
  type ClassificationOutput,
  type ConceptMapInput,
  type ConceptMapOutput,
  type EditorialPackageInput,
  type EditorialPackageOutput,
  type EditorialPackageRecord,
  type EvidenceExtractionInput,
  type EvidenceExtractionOutput,
  type IngestedDocument,
  type IntegrityReviewInput,
  type IntegrityReviewOutput,
  type MarketContextInput,
  type MarketContextOutput,
  type PaperLabelOntology,
  type RuntimeAgentName,
  type RuntimeWorkflow,
  type ShortlistOutput,
  type ShortlistRankingInput,
  type SourceDocument,
  type SourceScan,
  type SummaryInput,
  type SummaryOutput,
} from '@glyph/domain/runtime-agents'

import {
  ApplicationError,
  type Clock,
  type GlyphRepository,
  type IdFactory,
} from './index.js'

export type AgentInvocation<T> = {
  responseId: string
  model: string
  output: T
  warnings: string[]
  attempts: number
}

export interface RuntimeAgentSuite {
  classify(
    input: ClassificationInput,
  ): Promise<AgentInvocation<ClassificationOutput>>
  rank(input: ShortlistRankingInput): Promise<AgentInvocation<ShortlistOutput>>
  extractEvidence(
    input: EvidenceExtractionInput,
  ): Promise<AgentInvocation<EvidenceExtractionOutput>>
  summarize(input: SummaryInput): Promise<AgentInvocation<SummaryOutput>>
  mapConcepts(
    input: ConceptMapInput,
  ): Promise<AgentInvocation<ConceptMapOutput>>
  analyzeMarket(
    input: MarketContextInput,
  ): Promise<AgentInvocation<MarketContextOutput>>
  reviewIntegrity(
    input: IntegrityReviewInput,
  ): Promise<AgentInvocation<IntegrityReviewOutput>>
  packageEditorial(
    input: EditorialPackageInput,
  ): Promise<AgentInvocation<EditorialPackageOutput>>
}

export interface RuntimeRepository extends GlyphRepository {
  findIngestedDocument(fingerprint: string): Promise<IngestedDocument | null>
  getIngestedDocumentByPaperVersion(
    paperVersionId: Id,
  ): Promise<IngestedDocument | null>
  saveIngestedDocument(document: IngestedDocument): Promise<boolean>
  getSourceScan(id: Id): Promise<SourceScan | null>
  saveSourceScan(scan: SourceScan): Promise<void>
  getPaperLabelOntology(id: string): Promise<PaperLabelOntology | null>
  savePaperLabelOntology(ontology: PaperLabelOntology): Promise<void>
  getAgentRun(id: Id): Promise<AgentRunEnvelope | null>
  listAgentRuns(runId: Id): Promise<AgentRunEnvelope[]>
  saveAgentRun(run: AgentRunEnvelope): Promise<void>
  getRuntimeWorkflow(id: Id): Promise<RuntimeWorkflow | null>
  saveRuntimeWorkflow(workflow: RuntimeWorkflow): Promise<void>
  getEditorialPackage(id: Id): Promise<EditorialPackageRecord | null>
  saveEditorialPackage(editorialPackage: EditorialPackageRecord): Promise<void>
}

export interface SourceConnector {
  poll(source: SourceRegistryEntry): Promise<SourceDocument[]>
}

export interface SourceConnectorRegistry {
  get(connectorKey: string): SourceConnector | null
}

const defaultClock: Clock = () => new Date().toISOString()
const defaultIds: IdFactory = (prefix) => `${prefix}-${crypto.randomUUID()}`

export class SourceTrackerService {
  constructor(
    private readonly repository: RuntimeRepository,
    private readonly connectors: SourceConnectorRegistry,
    private readonly clock: Clock = defaultClock,
    private readonly ids: IdFactory = defaultIds,
  ) {}

  async scan(input: {
    trigger: 'SCHEDULED' | 'MANUAL'
    sourceIds?: Id[]
  }): Promise<SourceScan> {
    const startedAt = this.clock()
    const allSources = await this.repository.listSources()
    const requested =
      input.sourceIds === undefined
        ? allSources
        : allSources.filter((source) => input.sourceIds?.includes(source.id))
    if (
      input.sourceIds !== undefined &&
      requested.length !== new Set(input.sourceIds).size
    ) {
      const found = new Set(requested.map((source) => source.id))
      throw new ApplicationError(
        'SOURCE_NOT_FOUND',
        'One or more requested sources do not exist',
        404,
        input.sourceIds.filter((id) => !found.has(id)),
      )
    }
    let scan = SourceScanSchema.parse({
      schemaVersion,
      id: this.ids('scan'),
      trigger: input.trigger,
      sourceIds: requested.map((source) => source.id),
      status: 'RUNNING',
      discovered: 0,
      ingested: 0,
      duplicates: 0,
      excluded: 0,
      errors: [],
      startedAt,
      completedAt: null,
    })
    await this.repository.saveSourceScan(scan)

    for (const source of requested) {
      if (!source.enabled || source.rights === 'PROHIBITED') {
        scan = { ...scan, excluded: scan.excluded + 1 }
        continue
      }
      const connector = this.connectors.get(source.connectorKey)
      if (connector === null) {
        scan = {
          ...scan,
          errors: [
            ...scan.errors,
            {
              sourceId: source.id,
              message: `Connector ${source.connectorKey} is not configured`,
            },
          ],
        }
        continue
      }
      try {
        const documents = await connector.poll(
          SourceRegistryEntrySchema.parse(source),
        )
        scan = { ...scan, discovered: scan.discovered + documents.length }
        for (const raw of documents) {
          const document = SourceDocumentSchema.parse(raw)
          const result = await this.ingest(source, document)
          scan = {
            ...scan,
            ingested: scan.ingested + (result === 'INGESTED' ? 1 : 0),
            duplicates: scan.duplicates + (result === 'DUPLICATE' ? 1 : 0),
            excluded: scan.excluded + (result === 'EXCLUDED' ? 1 : 0),
          }
        }
      } catch (error) {
        scan = {
          ...scan,
          errors: [
            ...scan.errors,
            {
              sourceId: source.id,
              message:
                error instanceof Error ? error.message : 'Connector failed',
            },
          ],
        }
      }
    }

    const status =
      scan.errors.length === 0
        ? 'SUCCEEDED'
        : scan.ingested > 0
          ? 'PARTIAL'
          : 'FAILED'
    scan = SourceScanSchema.parse({
      ...scan,
      status,
      completedAt: this.clock(),
    })
    await this.repository.saveSourceScan(scan)
    return scan
  }

  private async ingest(
    source: SourceRegistryEntry,
    document: SourceDocument,
  ): Promise<'INGESTED' | 'DUPLICATE' | 'EXCLUDED'> {
    const fingerprint = `${document.documentType}:${document.contentSha256}`
    if ((await this.repository.findIngestedDocument(fingerprint)) !== null)
      return 'DUPLICATE'

    const missingPaperData =
      document.documentType === 'PAPER' &&
      (document.abstract === null ||
        document.authors.length === 0 ||
        document.pages === null ||
        document.pageCount === null)
    const exclusions: IngestedDocument['exclusionCodes'] = missingPaperData
      ? ['MISSING_METADATA']
      : []
    let paperId: Id | null = null
    let paperVersionId: Id | null = null

    if (
      document.documentType === 'PAPER' &&
      exclusions.length === 0 &&
      document.pageCount !== null
    ) {
      paperId = stableId('paper', document.doi ?? document.canonicalUrl)
      paperVersionId = stableId(
        'version',
        `${paperId}:${document.contentSha256}`,
      )
      const existing = await this.repository.getPaper(paperId)
      const paper = PaperSchema.parse({
        schemaVersion,
        id: paperId,
        title: document.title,
        authors: document.authors,
        lab: null,
        canonicalUrl: document.canonicalUrl,
        sourceId: source.id,
        topicLabels: existing?.topicLabels ?? [],
        mechanismLabels: existing?.mechanismLabels ?? [],
        difficulty: existing?.difficulty ?? 'UNCLASSIFIED',
        selectionRationale: existing?.selectionRationale ?? null,
      })
      await this.repository.savePaper(paper)
      await this.repository.savePaperVersion(
        PaperVersionSchema.parse({
          schemaVersion,
          id: paperVersionId,
          paperId,
          versionLabel: document.revisionDate,
          checksumSha256: document.contentSha256,
          licenceStatus: document.licenceStatus,
          publicationDate: document.publicationDate,
          revisionDate: document.revisionDate,
          pageCount: document.pageCount,
          assetReference: document.assetReference,
        }),
      )
    }

    const created = await this.repository.saveIngestedDocument(
      IngestedDocumentSchema.parse({
        schemaVersion,
        id: this.ids('document'),
        fingerprint,
        sourceId: source.id,
        externalId: document.externalId,
        paperId,
        paperVersionId,
        document,
        eligibility: exclusions.length === 0 ? 'ELIGIBLE' : 'EXCLUDED',
        exclusionCodes: exclusions,
        ingestedAt: this.clock(),
      }),
    )
    if (!created) return 'DUPLICATE'
    return exclusions.length === 0 ? 'INGESTED' : 'EXCLUDED'
  }
}

export class PaperLabelOntologyService {
  constructor(
    private readonly repository: RuntimeRepository,
    private readonly clock: Clock = defaultClock,
  ) {}

  async save(
    input: Omit<PaperLabelOntology, 'approvedAt' | 'approvedBy'>,
    editorId: Id,
  ): Promise<PaperLabelOntology> {
    const existing = await this.repository.getPaperLabelOntology(input.id)
    if (existing?.status === 'ACTIVE') {
      const existingRules = JSON.stringify({
        rules: existing.rules,
        acceptanceThreshold: existing.acceptanceThreshold,
        reviewBand: existing.reviewBand,
      })
      const proposedRules = JSON.stringify({
        rules: input.rules,
        acceptanceThreshold: input.acceptanceThreshold,
        reviewBand: input.reviewBand,
      })
      if (existingRules !== proposedRules || input.status === 'DRAFT') {
        throw new ApplicationError(
          'ONTOLOGY_IMMUTABLE',
          'An active ontology cannot be changed in place',
          409,
        )
      }
      if (input.status === 'ACTIVE') return existing
      const retired = PaperLabelOntologySchema.parse({
        ...existing,
        status: 'RETIRED',
      })
      await this.repository.savePaperLabelOntology(retired)
      return retired
    }
    const ontology = PaperLabelOntologySchema.parse({
      ...input,
      approvedAt: input.status === 'ACTIVE' ? this.clock() : null,
      approvedBy: input.status === 'ACTIVE' ? editorId : null,
    })
    await this.repository.savePaperLabelOntology(ontology)
    return ontology
  }

  async get(id: string): Promise<PaperLabelOntology> {
    const ontology = await this.repository.getPaperLabelOntology(id)
    if (ontology === null) {
      throw new ApplicationError(
        'ONTOLOGY_NOT_FOUND',
        'Paper label ontology not found',
        404,
      )
    }
    return ontology
  }
}

export class RuntimeWorkflowService {
  constructor(
    private readonly repository: RuntimeRepository,
    private readonly agents: RuntimeAgentSuite,
    private readonly clock: Clock = defaultClock,
    private readonly ids: IdFactory = defaultIds,
  ) {}

  async start(input: {
    paperVersionIds: Id[]
    ontologyId: string
  }): Promise<RuntimeWorkflow> {
    const ontology = await this.repository.getPaperLabelOntology(
      input.ontologyId,
    )
    if (
      ontology === null ||
      ontology.status !== 'ACTIVE' ||
      ontology.approvedAt === null ||
      ontology.approvedBy === null
    ) {
      throw new ApplicationError(
        'ONTOLOGY_NOT_ACTIVE',
        'An approved active labeling ontology is required',
        409,
      )
    }
    if (input.paperVersionIds.length < 3) {
      throw new ApplicationError(
        'INSUFFICIENT_CANDIDATES',
        'At least three paper versions are required',
        409,
      )
    }
    const timestamp = this.clock()
    let workflow = RuntimeWorkflowSchema.parse({
      schemaVersion,
      id: this.ids('workflow'),
      status: 'CLASSIFYING',
      ontologyId: ontology.id,
      candidatePaperVersionIds: [...new Set(input.paperVersionIds)],
      shortlist: null,
      selectedPaperVersionId: null,
      selectedBy: null,
      selectedAt: null,
      agentRunIds: [],
      editorialPackageId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    await this.repository.saveRuntimeWorkflow(workflow)

    const rankedInputs: ShortlistRankingInput['candidates'] = []
    for (const paperVersionId of workflow.candidatePaperVersionIds) {
      const stored = await this.requireDocument(paperVersionId)
      const invocation = await this.executeAgent(
        workflow.id,
        paperVersionId,
        'paper_classifier',
        () =>
          this.agents.classify({
            ontology,
            document: stored.document,
          }),
      )
      workflow = appendRun(workflow, invocation.envelope.id, this.clock())
      await this.repository.saveRuntimeWorkflow(workflow)
      const paper = await this.requirePaperForVersion(paperVersionId)
      const classified: Paper = PaperSchema.parse({
        ...paper,
        topicLabels: invocation.output.labels,
        mechanismLabels: invocation.output.mechanismLabels,
        difficulty: invocation.output.difficulty,
        selectionRationale: invocation.output.rationale,
      })
      await this.repository.savePaper(classified)
      if (invocation.output.decision === 'ACCEPT') {
        rankedInputs.push({
          paperVersionId,
          title: paper.title,
          labels: invocation.output.labels,
          classification: invocation.output,
        })
      }
    }

    if (rankedInputs.length < 3) {
      workflow = RuntimeWorkflowSchema.parse({
        ...workflow,
        status: 'FAILED',
        updatedAt: this.clock(),
      })
      await this.repository.saveRuntimeWorkflow(workflow)
      throw new ApplicationError(
        'INSUFFICIENT_ACCEPTED_CANDIDATES',
        'Fewer than three papers passed classification',
        409,
      )
    }
    const ranking = await this.executeAgent(
      workflow.id,
      rankedInputs[0]!.paperVersionId,
      'shortlist_ranker',
      () =>
        this.agents.rank({ candidates: rankedInputs, maximumCandidates: 4 }),
    )
    workflow = RuntimeWorkflowSchema.parse({
      ...appendRun(workflow, ranking.envelope.id, this.clock()),
      status: 'AWAITING_SELECTION',
      shortlist: ranking.output,
      updatedAt: this.clock(),
    })
    await this.repository.saveRuntimeWorkflow(workflow)
    return workflow
  }

  async select(input: {
    workflowId: Id
    paperVersionId: Id
    editorId: Id
  }): Promise<RuntimeWorkflow> {
    const workflow = await this.requireWorkflow(input.workflowId)
    if (
      workflow.status !== 'AWAITING_SELECTION' ||
      workflow.shortlist === null
    ) {
      throw new ApplicationError(
        'WORKFLOW_NOT_SELECTABLE',
        'Workflow is not awaiting editor selection',
        409,
      )
    }
    if (
      !workflow.shortlist.candidates.some(
        (candidate) => candidate.paperVersionId === input.paperVersionId,
      )
    ) {
      throw new ApplicationError(
        'PAPER_NOT_SHORTLISTED',
        'Selected paper is not in the shortlist',
        409,
      )
    }
    const updated = RuntimeWorkflowSchema.parse({
      ...workflow,
      status: 'PROCESSING_SELECTED',
      selectedPaperVersionId: input.paperVersionId,
      selectedBy: input.editorId,
      selectedAt: this.clock(),
      updatedAt: this.clock(),
    })
    await this.repository.saveRuntimeWorkflow(updated)
    return updated
  }

  async processSelected(input: {
    workflowId: Id
    approvedMarketData: MarketContextInput['approvedMarketData']
  }): Promise<RuntimeWorkflow> {
    let workflow = await this.requireWorkflow(input.workflowId)
    if (
      workflow.status !== 'PROCESSING_SELECTED' ||
      workflow.selectedPaperVersionId === null
    ) {
      throw new ApplicationError(
        'WORKFLOW_NOT_PROCESSABLE',
        'Workflow requires an editor-selected paper',
        409,
      )
    }
    const paperVersionId = workflow.selectedPaperVersionId
    const stored = await this.requireDocument(paperVersionId)
    const version = await this.repository.getPaperVersion(paperVersionId)
    const paper = await this.requirePaperForVersion(paperVersionId)
    if (version === null || stored.document.pages === null) {
      throw new ApplicationError(
        'PAPER_CONTENT_MISSING',
        'Selected paper has no parsed page content',
        409,
      )
    }

    const evidence = await this.executeAgent(
      workflow.id,
      paperVersionId,
      'evidence_extractor',
      () =>
        this.agents.extractEvidence({
          paperVersion: version,
          pages: stored.document.pages ?? [],
        }),
    )
    workflow = appendRun(workflow, evidence.envelope.id, this.clock())
    const shared = {
      paperTitle: paper.title,
      paperVersionId,
      claims: evidence.output.claims,
      evidenceSpans: evidence.output.evidenceSpans,
    }
    const [summary, concepts, market] = await Promise.all([
      this.executeAgent(workflow.id, paperVersionId, 'paper_summarizer', () =>
        this.agents.summarize(shared),
      ),
      this.executeAgent(workflow.id, paperVersionId, 'concept_mapper', () =>
        this.agents.mapConcepts(shared),
      ),
      this.executeAgent(
        workflow.id,
        paperVersionId,
        'market_context_analyst',
        () =>
          this.agents.analyzeMarket({
            ...shared,
            approvedMarketData: input.approvedMarketData,
          }),
      ),
    ])
    workflow = [summary, concepts, market].reduce(
      (current, run) => appendRun(current, run.envelope.id, this.clock()),
      workflow,
    )
    const integrityInput: IntegrityReviewInput = {
      paperVersion: version,
      evidence: evidence.output,
      summary: summary.output,
      concepts: concepts.output,
      marketContext: market.output,
      approvedMarketData: input.approvedMarketData,
    }
    const integrity = await this.executeAgent(
      workflow.id,
      paperVersionId,
      'integrity_reviewer',
      () => this.agents.reviewIntegrity(integrityInput),
    )
    workflow = appendRun(workflow, integrity.envelope.id, this.clock())
    if (!integrity.output.passed) {
      workflow = RuntimeWorkflowSchema.parse({
        ...workflow,
        status: 'QA_BLOCKED',
        updatedAt: this.clock(),
      })
      await this.repository.saveRuntimeWorkflow(workflow)
      return workflow
    }
    const packagingInput: EditorialPackageInput = {
      paperVersionId,
      summary: summary.output,
      concepts: concepts.output,
      marketContext: market.output,
      integrityReview: integrity.output,
    }
    const packaged = await this.executeAgent(
      workflow.id,
      paperVersionId,
      'editorial_packager',
      () => this.agents.packageEditorial(packagingInput),
    )
    workflow = appendRun(workflow, packaged.envelope.id, this.clock())
    const record = EditorialPackageRecordSchema.parse({
      schemaVersion,
      id: this.ids('package'),
      paperVersionId,
      workflowRunId: workflow.id,
      status: 'AWAITING_APPROVAL',
      output: packaged.output,
      integrityReview: integrity.output,
      approvedBy: null,
      approvedAt: null,
      publishedAt: null,
      createdAt: this.clock(),
    })
    await this.repository.saveEditorialPackage(record)
    workflow = RuntimeWorkflowSchema.parse({
      ...workflow,
      status: 'AWAITING_PUBLICATION_APPROVAL',
      editorialPackageId: record.id,
      updatedAt: this.clock(),
    })
    await this.repository.saveRuntimeWorkflow(workflow)
    return workflow
  }

  private async executeAgent<T>(
    runId: Id,
    paperVersionId: Id,
    agent: RuntimeAgentName,
    invoke: () => Promise<AgentInvocation<T>>,
  ): Promise<{ output: T; envelope: AgentRunEnvelope }> {
    const id = this.ids('agent-run')
    const startedAt = this.clock()
    const definition = agentDefinitions[agent]
    const running = AgentRunEnvelopeSchema.parse({
      schemaVersion,
      id,
      runId,
      paperVersionId,
      agent,
      agentVersion: definition.agentVersion,
      promptVersion: definition.promptVersion,
      model: 'pending',
      status: 'RUNNING',
      attempt: 1,
      warnings: [],
      result: null,
      error: null,
      responseId: null,
      startedAt,
      completedAt: null,
    })
    await this.repository.saveAgentRun(running)
    try {
      const invocation = await invoke()
      const succeeded = AgentRunEnvelopeSchema.parse({
        ...running,
        model: invocation.model,
        status: 'SUCCEEDED',
        attempt: invocation.attempts,
        warnings: invocation.warnings,
        result: invocation.output,
        responseId: invocation.responseId,
        completedAt: this.clock(),
      })
      await this.repository.saveAgentRun(succeeded)
      return { output: invocation.output, envelope: succeeded }
    } catch (error) {
      const normalized = normalizeAgentError(error)
      const failed = AgentRunEnvelopeSchema.parse({
        ...running,
        status: 'FAILED',
        error: normalized,
        completedAt: this.clock(),
      })
      await this.repository.saveAgentRun(failed)
      throw new ApplicationError('AGENT_FAILED', `${agent} failed`, 502, failed)
    }
  }

  private async requireDocument(paperVersionId: Id): Promise<IngestedDocument> {
    const document =
      await this.repository.getIngestedDocumentByPaperVersion(paperVersionId)
    if (document === null || document.eligibility !== 'ELIGIBLE') {
      throw new ApplicationError(
        'DOCUMENT_NOT_ELIGIBLE',
        `No eligible document for ${paperVersionId}`,
        404,
      )
    }
    return document
  }

  private async requirePaperForVersion(paperVersionId: Id): Promise<Paper> {
    const version = await this.repository.getPaperVersion(paperVersionId)
    const paper =
      version === null ? null : await this.repository.getPaper(version.paperId)
    if (paper === null)
      throw new ApplicationError('PAPER_NOT_FOUND', 'Paper not found', 404)
    return paper
  }

  private async requireWorkflow(id: Id): Promise<RuntimeWorkflow> {
    const workflow = await this.repository.getRuntimeWorkflow(id)
    if (workflow === null)
      throw new ApplicationError(
        'WORKFLOW_NOT_FOUND',
        'Runtime workflow not found',
        404,
      )
    return workflow
  }
}

export class RuntimePublicationService {
  constructor(
    private readonly repository: RuntimeRepository,
    private readonly clock: Clock = defaultClock,
  ) {}

  async approve(packageId: Id, editorId: Id): Promise<EditorialPackageRecord> {
    const record = await this.requirePackage(packageId)
    if (
      !record.integrityReview.passed ||
      record.integrityReview.blockers.length > 0
    ) {
      throw new ApplicationError(
        'INTEGRITY_BLOCKED',
        'Package has integrity blockers',
        409,
      )
    }
    if (record.status !== 'AWAITING_APPROVAL') {
      throw new ApplicationError(
        'PACKAGE_NOT_APPROVABLE',
        'Package is not awaiting approval',
        409,
      )
    }
    const approved = EditorialPackageRecordSchema.parse({
      ...record,
      status: 'APPROVED',
      approvedBy: editorId,
      approvedAt: this.clock(),
    })
    await this.repository.saveEditorialPackage(approved)
    return approved
  }

  async publish(packageId: Id): Promise<EditorialPackageRecord> {
    const record = await this.requirePackage(packageId)
    if (
      record.status !== 'APPROVED' ||
      record.approvedBy === null ||
      record.approvedAt === null
    ) {
      throw new ApplicationError(
        'PACKAGE_NOT_APPROVED',
        'Editor approval is required before publication',
        409,
      )
    }
    if (
      !record.integrityReview.passed ||
      record.integrityReview.blockers.length > 0
    ) {
      throw new ApplicationError(
        'INTEGRITY_BLOCKED',
        'Package has integrity blockers',
        409,
      )
    }
    const published = EditorialPackageRecordSchema.parse({
      ...record,
      status: 'PUBLISHED',
      publishedAt: this.clock(),
    })
    await this.repository.saveEditorialPackage(published)
    const workflow = await this.repository.getRuntimeWorkflow(
      record.workflowRunId,
    )
    if (workflow !== null) {
      await this.repository.saveRuntimeWorkflow(
        RuntimeWorkflowSchema.parse({
          ...workflow,
          status: 'PUBLISHED',
          updatedAt: this.clock(),
        }),
      )
    }
    return published
  }

  private async requirePackage(id: Id): Promise<EditorialPackageRecord> {
    const record = await this.repository.getEditorialPackage(id)
    if (record === null)
      throw new ApplicationError(
        'PACKAGE_NOT_FOUND',
        'Editorial package not found',
        404,
      )
    return record
  }
}

export class MapConnectorRegistry implements SourceConnectorRegistry {
  constructor(
    private readonly connectors: ReadonlyMap<string, SourceConnector>,
  ) {}
  get(connectorKey: string): SourceConnector | null {
    return this.connectors.get(connectorKey) ?? null
  }
}

const agentDefinitions = {
  paper_classifier: {
    agentVersion: '1.0.0',
    promptVersion: 'paper-classifier.v1',
  },
  shortlist_ranker: {
    agentVersion: '1.0.0',
    promptVersion: 'shortlist-ranker.v1',
  },
  evidence_extractor: {
    agentVersion: '1.0.0',
    promptVersion: 'evidence-extractor.v1',
  },
  paper_summarizer: {
    agentVersion: '1.0.0',
    promptVersion: 'paper-summarizer.v1',
  },
  concept_mapper: { agentVersion: '1.0.0', promptVersion: 'concept-mapper.v1' },
  market_context_analyst: {
    agentVersion: '1.0.0',
    promptVersion: 'market-context.v1',
  },
  integrity_reviewer: {
    agentVersion: '1.0.0',
    promptVersion: 'integrity-reviewer.v1',
  },
  editorial_packager: {
    agentVersion: '1.0.0',
    promptVersion: 'editorial-packager.v1',
  },
} as const

function stableId(prefix: string, value: string): string {
  return `${prefix}-${createHash('sha256').update(value).digest('hex').slice(0, 24)}`
}

function appendRun(
  workflow: RuntimeWorkflow,
  agentRunId: Id,
  updatedAt: string,
): RuntimeWorkflow {
  return RuntimeWorkflowSchema.parse({
    ...workflow,
    agentRunIds: [...workflow.agentRunIds, agentRunId],
    updatedAt,
  })
}

function normalizeAgentError(error: unknown): {
  code:
    | 'VALIDATION_ERROR'
    | 'REFUSAL'
    | 'RATE_LIMITED'
    | 'TIMEOUT'
    | 'PROVIDER_ERROR'
    | 'RETRY_EXHAUSTED'
    | 'INTEGRITY_BLOCKED'
  message: string
  retryable: boolean
} {
  const candidate = error as {
    code?: unknown
    message?: unknown
    retryable?: unknown
  }
  const allowed = new Set([
    'VALIDATION_ERROR',
    'REFUSAL',
    'RATE_LIMITED',
    'TIMEOUT',
    'PROVIDER_ERROR',
    'RETRY_EXHAUSTED',
    'INTEGRITY_BLOCKED',
  ])
  return {
    code:
      typeof candidate.code === 'string' && allowed.has(candidate.code)
        ? (candidate.code as ReturnType<typeof normalizeAgentError>['code'])
        : 'PROVIDER_ERROR',
    message:
      typeof candidate.message === 'string' && candidate.message.length > 0
        ? candidate.message
        : 'Unknown agent failure',
    retryable: candidate.retryable === true,
  }
}
