import { describe, expect, it } from 'vitest'

import {
  schemaVersion,
  type PipelineRun,
  type SourceAuditEvent,
  type SourceRegistryEntry,
} from '@glyph/domain'

import {
  DeferredConnectorTester,
  PipelineService,
  SourceRegistryService,
  type GlyphRepository,
} from './index.js'

const now = () => '2026-07-21T12:00:00.000Z'
let sequence = 0
const ids = (prefix: string) => `${prefix}-${++sequence}`

describe('SourceRegistryService', () => {
  it('creates, disables, tests, and audits a governed source', async () => {
    const repository = createTestRepository()
    const service = new SourceRegistryService(
      repository,
      new DeferredConnectorTester(),
      now,
      ids,
    )
    const source = await service.create(
      {
        name: 'Example Lab',
        kind: 'LAB',
        baseUrl: 'https://example.com/research',
        enabled: true,
        priority: 80,
        rights: 'PUBLIC_REUSE_ALLOWED',
        connectorKey: 'example-lab',
        editorialNotes: null,
      },
      'editor-1',
    )

    await service.setEnabled(source.id, false, 'editor-1')
    const testResult = await service.test(source.id, 'editor-1')
    const audit = await service.audit(source.id)

    expect(testResult.ok).toBe(false)
    expect(audit.map((event) => event.action)).toEqual([
      'CREATED',
      'DISABLED',
      'TESTED',
    ])
  })

  it('returns a typed not-found error', async () => {
    const service = new SourceRegistryService(
      createTestRepository(),
      new DeferredConnectorTester(),
      now,
      ids,
    )
    await expect(
      service.setEnabled('missing', true, 'editor-1'),
    ).rejects.toEqual(
      expect.objectContaining({
        code: 'SOURCE_NOT_FOUND',
        statusCode: 404,
      }),
    )
  })
})

describe('PipelineService', () => {
  it('returns the first successful run for duplicate idempotency keys', async () => {
    const repository = createTestRepository()
    let executions = 0
    const service = new PipelineService(
      repository,
      {
        execute: () => {
          executions += 1
          return Promise.resolve({ accepted: true })
        },
      },
      now,
      ids,
    )

    const input = {
      paperVersionId: 'version-1',
      stage: 'CLASSIFY' as const,
      idempotencyKey: 'version-1:CLASSIFY:v1',
    }
    const first = await service.run(input)
    const second = await service.run(input)

    expect(first.status).toBe('SUCCEEDED')
    expect(second).toEqual(first)
    expect(executions).toBe(1)
  })

  it('records retryable stage failures explicitly', async () => {
    const repository = createTestRepository()
    const service = new PipelineService(
      repository,
      { execute: () => Promise.reject(new Error('provider unavailable')) },
      now,
      ids,
    )
    const run = await service.run({
      paperVersionId: 'version-1',
      stage: 'PARSE',
      idempotencyKey: 'parse-once',
    })

    expect(run).toMatchObject({
      schemaVersion,
      status: 'FAILED',
      error: { code: 'STAGE_FAILED', message: 'provider unavailable' },
    })
  })
})

function createTestRepository(): GlyphRepository {
  const sources = new Map<string, SourceRegistryEntry>()
  const audits: SourceAuditEvent[] = []
  const runs = new Map<string, PipelineRun>()
  return {
    healthCheck: () => Promise.resolve(),
    listSources: () => Promise.resolve([...sources.values()]),
    getSource: (id) => Promise.resolve(sources.get(id) ?? null),
    saveSource: (source) => {
      sources.set(source.id, source)
      return Promise.resolve()
    },
    appendSourceAudit: (event) => {
      audits.push(event)
      return Promise.resolve()
    },
    listSourceAudit: (sourceId) =>
      Promise.resolve(audits.filter((event) => event.sourceId === sourceId)),
    getPaper: () => Promise.resolve(null),
    savePaper: () => Promise.resolve(),
    getPaperVersion: () => Promise.resolve(null),
    savePaperVersion: () => Promise.resolve(),
    getEditionBySlug: () => Promise.resolve(null),
    getEditionByReportId: () => Promise.resolve(null),
    saveEdition: () => Promise.resolve(),
    findPipelineRun: (key) => Promise.resolve(runs.get(key) ?? null),
    savePipelineRun: (run) => {
      runs.set(run.idempotencyKey, run)
      return Promise.resolve()
    },
  }
}
