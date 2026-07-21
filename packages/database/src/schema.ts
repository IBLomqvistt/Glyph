import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

export const claimKind = pgEnum('claim_kind', [
  'PAPER_FACT',
  'AUTHOR_CLAIM',
  'GLYPH_CALCULATION',
  'GLYPH_INTERPRETATION',
  'INVESTMENT_HYPOTHESIS',
])

export const papers = pgTable('papers', {
  id: text().primaryKey(),
  schemaVersion: integer().notNull(),
  title: text().notNull(),
  sourceType: text().notNull(),
  payload: jsonb().notNull(),
})

export const paperVersions = pgTable('paper_versions', {
  id: text().primaryKey(),
  schemaVersion: integer().notNull(),
  paperId: text()
    .notNull()
    .references(() => papers.id),
  checksumSha256: text().notNull().unique(),
  versionLabel: text().notNull(),
  licenceStatus: text().notNull(),
  publicationDate: date().notNull(),
  revisionDate: date().notNull(),
  pageCount: integer().notNull(),
  assetReference: text().notNull(),
  payload: jsonb().notNull(),
})

export const reports = pgTable('reports', {
  id: text().primaryKey(),
  schemaVersion: integer().notNull(),
  paperVersionId: text()
    .notNull()
    .references(() => paperVersions.id),
  slug: text().notNull().unique(),
  status: text().notNull(),
  readingTimeMinutes: integer().notNull(),
  payload: jsonb().notNull(),
  editorApprovedAt: timestamp({ withTimezone: true }),
})

export const evidenceSpans = pgTable('evidence_spans', {
  id: text().primaryKey(),
  schemaVersion: integer().notNull(),
  paperVersionId: text()
    .notNull()
    .references(() => paperVersions.id),
  pageNumber: integer().notNull(),
  section: text().notNull(),
  exactText: text().notNull(),
  boxes: jsonb().notNull(),
  retrievalText: text(),
  embedding: real().array(),
})

export const claims = pgTable('claims', {
  id: text().primaryKey(),
  schemaVersion: integer().notNull(),
  reportId: text()
    .notNull()
    .references(() => reports.id),
  kind: claimKind().notNull(),
  material: boolean().notNull(),
  supportStatus: text().notNull(),
  text: text().notNull(),
})

export const claimEvidence = pgTable(
  'claim_evidence',
  {
    claimId: text()
      .notNull()
      .references(() => claims.id),
    evidenceSpanId: text()
      .notNull()
      .references(() => evidenceSpans.id),
  },
  (table) => [primaryKey({ columns: [table.claimId, table.evidenceSpanId] })],
)

export const pipelineRuns = pgTable('pipeline_runs', {
  id: text().primaryKey(),
  schemaVersion: integer().notNull(),
  paperVersionId: text()
    .notNull()
    .references(() => paperVersions.id),
  stage: text().notNull(),
  attempt: integer().notNull(),
  idempotencyKey: text().notNull().unique(),
  status: text().notNull(),
  result: jsonb(),
  error: jsonb(),
  createdAt: timestamp({ withTimezone: true }).notNull(),
  updatedAt: timestamp({ withTimezone: true }).notNull(),
})

export const aiGenerationRecords = pgTable('ai_generation_records', {
  id: text().primaryKey(),
  schemaVersion: integer().notNull(),
  task: text().notNull(),
  model: text().notNull(),
  promptVersion: text().notNull(),
  outputSchemaVersion: integer().notNull(),
  generatedAt: timestamp({ withTimezone: true }).notNull(),
  sourcePaperVersionId: text().references(() => paperVersions.id),
  result: jsonb().notNull(),
})

export const reportSections = pgTable('report_sections', {
  id: text().primaryKey(),
  schemaVersion: integer().notNull(),
  reportId: text()
    .notNull()
    .references(() => reports.id),
  kind: text().notNull(),
  depth: text().notNull(),
  order: integer().notNull(),
  payload: jsonb().notNull(),
})

export const concepts = pgTable('concepts', {
  id: text().primaryKey(),
  schemaVersion: integer().notNull(),
  name: text().notNull(),
  payload: jsonb().notNull(),
})

export const reportConcepts = pgTable(
  'report_concepts',
  {
    reportId: text()
      .notNull()
      .references(() => reports.id),
    conceptId: text()
      .notNull()
      .references(() => concepts.id),
  },
  (table) => [primaryKey({ columns: [table.reportId, table.conceptId] })],
)

export const visualSpecs = pgTable('visual_specs', {
  id: text().primaryKey(),
  schemaVersion: integer().notNull(),
  title: text().notNull(),
  payload: jsonb().notNull(),
})

export const reportVisuals = pgTable(
  'report_visuals',
  {
    reportId: text()
      .notNull()
      .references(() => reports.id),
    visualSpecId: text()
      .notNull()
      .references(() => visualSpecs.id),
  },
  (table) => [primaryKey({ columns: [table.reportId, table.visualSpecId] })],
)

export const marketMetrics = pgTable('market_metrics', {
  id: text().primaryKey(),
  schemaVersion: integer().notNull(),
  reportId: text()
    .notNull()
    .references(() => reports.id),
  sourceUrl: text().notNull(),
  retrievalDate: date().notNull(),
  modelOrProductVersion: text().notNull(),
  value: real().notNull(),
  unit: text().notNull(),
  denominator: text().notNull(),
  conditions: text().notNull(),
  relevance: text().notNull(),
  comparisonLimitations: text().notNull(),
})

export const users = pgTable('glyph_users', {
  id: text().primaryKey(),
  schemaVersion: integer().notNull(),
  role: text().notNull(),
  preferences: jsonb().notNull(),
})

export const savedConcepts = pgTable(
  'saved_concepts',
  {
    userId: text()
      .notNull()
      .references(() => users.id),
    conceptId: text()
      .notNull()
      .references(() => concepts.id),
    savedAt: timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.conceptId] })],
)

export const questionAnswers = pgTable('question_answers', {
  id: text().primaryKey(),
  schemaVersion: integer().notNull(),
  reportId: text()
    .notNull()
    .references(() => reports.id),
  question: text().notNull(),
  outcome: text().notNull(),
  answerText: text(),
  generatedAt: timestamp({ withTimezone: true }).notNull(),
  validatedAt: timestamp({ withTimezone: true }).notNull(),
})

export const questionAnswerEvidence = pgTable(
  'question_answer_evidence',
  {
    questionAnswerId: text()
      .notNull()
      .references(() => questionAnswers.id),
    evidenceSpanId: text()
      .notNull()
      .references(() => evidenceSpans.id),
  },
  (table) => [
    primaryKey({ columns: [table.questionAnswerId, table.evidenceSpanId] }),
  ],
)
