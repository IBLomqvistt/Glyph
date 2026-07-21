import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

export const claimKind = pgEnum('claim_kind', [
  'PAPER_FACT',
  'MEASURED_RESULT',
  'AUTHOR_CLAIM',
  'GLYPH_CALCULATION',
  'GLYPH_INTERPRETATION',
  'INVESTMENT_HYPOTHESIS',
  'INSUFFICIENT_EVIDENCE',
])

export const sources = pgTable('sources', {
  id: text('id').primaryKey(),
  schemaVersion: integer('schema_version').notNull(),
  name: text('name').notNull(),
  kind: text('kind').notNull(),
  baseUrl: text('base_url').notNull(),
  enabled: boolean('enabled').notNull(),
  priority: integer('priority').notNull(),
  rights: text('rights').notNull(),
  connectorKey: text('connector_key').notNull(),
  payload: jsonb('payload').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
})

export const sourceAuditEvents = pgTable('source_audit_events', {
  id: text('id').primaryKey(),
  schemaVersion: integer('schema_version').notNull(),
  sourceId: text('source_id')
    .notNull()
    .references(() => sources.id),
  actorId: text('actor_id').notNull(),
  action: text('action').notNull(),
  outcome: text('outcome').notNull(),
  detail: text('detail').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  payload: jsonb('payload').notNull(),
})

export const papers = pgTable('papers', {
  id: text('id').primaryKey(),
  schemaVersion: integer('schema_version').notNull(),
  sourceId: text('source_id')
    .notNull()
    .references(() => sources.id),
  title: text('title').notNull(),
  canonicalUrl: text('canonical_url').notNull(),
  payload: jsonb('payload').notNull(),
})

export const paperVersions = pgTable('paper_versions', {
  id: text('id').primaryKey(),
  schemaVersion: integer('schema_version').notNull(),
  paperId: text('paper_id')
    .notNull()
    .references(() => papers.id),
  checksumSha256: text('checksum_sha256').notNull().unique(),
  versionLabel: text('version_label').notNull(),
  licenceStatus: text('licence_status').notNull(),
  publicationDate: date('publication_date').notNull(),
  revisionDate: date('revision_date').notNull(),
  pageCount: integer('page_count').notNull(),
  assetReference: text('asset_reference'),
  payload: jsonb('payload').notNull(),
})

export const reports = pgTable('reports', {
  id: text('id').primaryKey(),
  schemaVersion: integer('schema_version').notNull(),
  paperVersionId: text('paper_version_id')
    .notNull()
    .references(() => paperVersions.id),
  slug: text('slug').notNull().unique(),
  status: text('status').notNull(),
  readingTimeMinutes: integer('reading_time_minutes').notNull(),
  payload: jsonb('payload').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  editorApprovedAt: timestamp('editor_approved_at', { withTimezone: true }),
})

export const reportSections = pgTable('report_sections', {
  id: text('id').primaryKey(),
  schemaVersion: integer('schema_version').notNull(),
  reportId: text('report_id')
    .notNull()
    .references(() => reports.id),
  kind: text('kind').notNull(),
  depth: text('depth').notNull(),
  sortOrder: integer('sort_order').notNull(),
  payload: jsonb('payload').notNull(),
})

export const evidenceSpans = pgTable('evidence_spans', {
  id: text('id').primaryKey(),
  schemaVersion: integer('schema_version').notNull(),
  paperVersionId: text('paper_version_id')
    .notNull()
    .references(() => paperVersions.id),
  pageNumber: integer('page_number').notNull(),
  sectionTitle: text('section').notNull(),
  text: text('exact_text').notNull(),
  boundingBoxes: jsonb('boxes').notNull(),
})

export const claims = pgTable('claims', {
  id: text('id').primaryKey(),
  schemaVersion: integer('schema_version').notNull(),
  reportId: text('report_id')
    .notNull()
    .references(() => reports.id),
  kind: claimKind('kind').notNull(),
  material: boolean('material').notNull(),
  supportStatus: text('support_status').notNull(),
  claimText: text('claim_text').notNull(),
})

export const claimEvidence = pgTable(
  'claim_evidence',
  {
    claimId: text('claim_id')
      .notNull()
      .references(() => claims.id),
    evidenceSpanId: text('evidence_span_id')
      .notNull()
      .references(() => evidenceSpans.id),
  },
  (table) => [primaryKey({ columns: [table.claimId, table.evidenceSpanId] })],
)

export const concepts = pgTable('concepts', {
  id: text('id').primaryKey(),
  schemaVersion: integer('schema_version').notNull(),
  name: text('name').notNull(),
  payload: jsonb('payload').notNull(),
})

export const visualSpecs = pgTable('visual_specs', {
  id: text('id').primaryKey(),
  schemaVersion: integer('schema_version').notNull(),
  title: text('title').notNull(),
  payload: jsonb('payload').notNull(),
})

export const marketMetrics = pgTable('market_metrics', {
  id: text('id').primaryKey(),
  schemaVersion: integer('schema_version').notNull(),
  reportId: text('report_id')
    .notNull()
    .references(() => reports.id),
  sourceUrl: text('source_url').notNull(),
  retrievalDate: date('retrieval_date').notNull(),
  payload: jsonb('payload').notNull(),
})

export const pipelineRuns = pgTable('pipeline_runs', {
  id: text('id').primaryKey(),
  schemaVersion: integer('schema_version').notNull(),
  paperVersionId: text('paper_version_id')
    .notNull()
    .references(() => paperVersions.id),
  stage: text('stage').notNull(),
  attempt: integer('attempt').notNull(),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  status: text('status').notNull(),
  result: jsonb('result'),
  error: jsonb('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  payload: jsonb('payload').notNull(),
})

export const ingestedDocuments = pgTable('ingested_documents', {
  id: text('id').primaryKey(),
  fingerprint: text('fingerprint').notNull().unique(),
  sourceId: text('source_id')
    .notNull()
    .references(() => sources.id),
  paperVersionId: text('paper_version_id').references(() => paperVersions.id),
  eligibility: text('eligibility').notNull(),
  payload: jsonb('payload').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
})

export const sourceScans = pgTable('source_scans', {
  id: text('id').primaryKey(),
  trigger: text('trigger').notNull(),
  status: text('status').notNull(),
  payload: jsonb('payload').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
})

export const paperLabelOntologies = pgTable('paper_label_ontologies', {
  id: text('id').primaryKey(),
  version: integer('version').notNull(),
  status: text('status').notNull(),
  payload: jsonb('payload').notNull(),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
})

export const agentRuns = pgTable('agent_runs', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull(),
  paperVersionId: text('paper_version_id')
    .notNull()
    .references(() => paperVersions.id),
  agent: text('agent').notNull(),
  status: text('status').notNull(),
  payload: jsonb('payload').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
})

export const runtimeWorkflows = pgTable('runtime_workflows', {
  id: text('id').primaryKey(),
  status: text('status').notNull(),
  selectedPaperVersionId: text('selected_paper_version_id').references(
    () => paperVersions.id,
  ),
  editorialPackageId: text('editorial_package_id'),
  payload: jsonb('payload').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
})

export const editorialPackages = pgTable('editorial_packages', {
  id: text('id').primaryKey(),
  paperVersionId: text('paper_version_id')
    .notNull()
    .references(() => paperVersions.id),
  workflowRunId: text('workflow_run_id')
    .notNull()
    .references(() => runtimeWorkflows.id),
  status: text('status').notNull(),
  payload: jsonb('payload').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
})
