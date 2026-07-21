import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { getTableName } from 'drizzle-orm'
import { getDatabase } from './index'
import * as schema from './schema'

describe('PostgreSQL provider boundary', () => {
  it('initializes lazily and fails clearly when no provider is configured', () => {
    const previous = process.env.DATABASE_URL
    delete process.env.DATABASE_URL
    expect(() => getDatabase()).toThrow(
      'DATABASE_URL is required for the PostgreSQL adapter.',
    )
    if (previous === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = previous
  })

  it('keeps every required Drizzle table represented in the migration', async () => {
    const migration = await readFile(
      new URL('../migrations/0001_glyph_v1.sql', import.meta.url),
      'utf8',
    )
    const tables = [
      schema.papers,
      schema.paperVersions,
      schema.reports,
      schema.evidenceSpans,
      schema.claims,
      schema.claimEvidence,
      schema.pipelineRuns,
      schema.aiGenerationRecords,
      schema.reportSections,
      schema.concepts,
      schema.reportConcepts,
      schema.visualSpecs,
      schema.reportVisuals,
      schema.marketMetrics,
      schema.users,
      schema.savedConcepts,
      schema.questionAnswers,
      schema.questionAnswerEvidence,
    ]
    for (const table of tables) {
      expect(migration).toContain(`CREATE TABLE ${getTableName(table)} (`)
    }
  })
})
