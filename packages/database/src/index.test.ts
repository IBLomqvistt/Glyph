import { describe, expect, it } from 'vitest'

import { schemaVersion } from '@glyph/domain'

import { InMemoryGlyphRepository } from './index.js'
import {
  agentRuns,
  editorialPackages,
  ingestedDocuments,
  paperVersions,
  pipelineRuns,
  reports,
  sources,
} from './schema.js'

describe('PostgreSQL schema mapping', () => {
  it('matches the snake_case migration contract', () => {
    expect(sources.schemaVersion.name).toBe('schema_version')
    expect(sources.baseUrl.name).toBe('base_url')
    expect(paperVersions.checksumSha256.name).toBe('checksum_sha256')
    expect(reports.editorApprovedAt.name).toBe('editor_approved_at')
    expect(pipelineRuns.idempotencyKey.name).toBe('idempotency_key')
    expect(ingestedDocuments.paperVersionId.name).toBe('paper_version_id')
    expect(agentRuns.runId.name).toBe('run_id')
    expect(editorialPackages.workflowRunId.name).toBe('workflow_run_id')
  })
})

describe('InMemoryGlyphRepository', () => {
  it('round-trips governed sources without sharing mutable state', async () => {
    const repository = new InMemoryGlyphRepository()
    const source = {
      schemaVersion,
      id: 'source-1',
      name: 'Example',
      kind: 'LAB' as const,
      baseUrl: 'https://example.com',
      enabled: true,
      priority: 80,
      rights: 'PUBLIC_REUSE_ALLOWED' as const,
      connectorKey: 'example',
      editorialNotes: null,
      createdAt: '2026-07-21T00:00:00.000Z',
      updatedAt: '2026-07-21T00:00:00.000Z',
    }
    await repository.saveSource(source)
    const saved = await repository.getSource(source.id)

    expect(saved).toEqual(source)
    expect(saved).not.toBe(source)
  })
})
