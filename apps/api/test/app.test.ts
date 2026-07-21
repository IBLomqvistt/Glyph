import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { FastifyInstance } from 'fastify'

import { InMemoryGlyphRepository } from '@glyph/database'

import { buildApp } from '../src/app.js'
import type { ApiConfig } from '../src/config.js'

const token = 'test-editor-token-at-least-24-chars'
const config: ApiConfig = {
  NODE_ENV: 'test',
  HOST: '127.0.0.1',
  PORT: 4000,
  LOG_LEVEL: 'silent',
  GLYPH_EDITOR_TOKEN: token,
  GLYPH_ALLOW_IN_MEMORY: true,
  OPENAI_MODEL: 'gpt-5.6-terra',
}

type ErrorPayload = { error: { code: string } }
type SourcePayload = { data: { id: string; enabled: boolean } }
type SourceTestPayload = { data: { ok: boolean } }
type AuditPayload = { data: unknown[] }
type PipelinePayload = {
  data: { status: string; error?: { code: string } }
}

describe('Glyph API', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = await buildApp({ config, repository: new InMemoryGlyphRepository() })
  })

  afterEach(async () => {
    await app.close()
  })

  it('reports liveness and readiness', async () => {
    const live = await app.inject({ method: 'GET', url: '/health/live' })
    const ready = await app.inject({ method: 'GET', url: '/health/ready' })

    expect(live.statusCode).toBe(200)
    expect(live.json()).toEqual({ status: 'ok' })
    expect(ready.statusCode).toBe(200)
    expect(ready.json()).toEqual({ status: 'ready' })
  })

  it('protects editor writes', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/sources',
      payload: sourcePayload(),
    })

    expect(response.statusCode).toBe(401)
    expect(response.json<ErrorPayload>().error.code).toBe('UNAUTHORIZED')
  })

  it('creates, disables, tests, and audits sources', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/v1/sources',
      headers: editorHeaders(),
      payload: sourcePayload(),
    })
    const sourceId = created.json<SourcePayload>().data.id
    const disabled = await app.inject({
      method: 'PATCH',
      url: `/v1/sources/${sourceId}/enabled`,
      headers: editorHeaders(),
      payload: { enabled: false },
    })
    const tested = await app.inject({
      method: 'POST',
      url: `/v1/sources/${sourceId}/test`,
      headers: editorHeaders(),
    })
    const audit = await app.inject({
      method: 'GET',
      url: `/v1/sources/${sourceId}/audit`,
    })

    expect(created.statusCode).toBe(201)
    expect(disabled.json<SourcePayload>().data.enabled).toBe(false)
    expect(tested.json<SourceTestPayload>().data).toMatchObject({ ok: false })
    expect(audit.json<AuditPayload>().data).toHaveLength(3)
  })

  it('runs stages idempotently and blocks live publication stages', async () => {
    const payload = {
      paperVersionId: 'version-1',
      stage: 'CLASSIFY',
      idempotencyKey: 'version-1:CLASSIFY:v1',
    }
    const first = await app.inject({
      method: 'POST',
      url: '/v1/pipeline/runs',
      headers: editorHeaders(),
      payload,
    })
    const second = await app.inject({
      method: 'POST',
      url: '/v1/pipeline/runs',
      headers: editorHeaders(),
      payload,
    })
    const publish = await app.inject({
      method: 'POST',
      url: '/v1/pipeline/runs',
      headers: editorHeaders(),
      payload: {
        ...payload,
        stage: 'PUBLISH',
        idempotencyKey: 'version-1:PUBLISH:v1',
      },
    })

    const firstPayload = first.json<PipelinePayload>()
    expect(firstPayload.data.status).toBe('SUCCEEDED')
    expect(second.json<PipelinePayload>().data).toEqual(firstPayload.data)
    expect(publish.json<PipelinePayload>().data).toMatchObject({
      status: 'FAILED',
      error: { code: 'STAGE_FAILED' },
    })
  })

  it('returns stable validation errors for invalid stages', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/pipeline/runs',
      headers: editorHeaders(),
      payload: {
        paperVersionId: 'version-1',
        stage: 'MAKE_UP_FACTS',
        idempotencyKey: 'invalid-stage-key',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json<ErrorPayload>().error).toMatchObject({
      code: 'VALIDATION_ERROR',
    })
  })

  it('lists the eight runtime agents and fails closed without an API key', async () => {
    const roster = await app.inject({
      method: 'GET',
      url: '/v1/runtime-agents',
    })
    const workflow = await app.inject({
      method: 'POST',
      url: '/v1/runtime-workflows',
      headers: editorHeaders(),
      payload: {
        paperVersionIds: ['one', 'two', 'three'],
        ontologyId: 'paper-label-ontology.v1',
      },
    })

    expect(Object.keys(roster.json<{ data: object }>().data)).toHaveLength(8)
    expect(workflow.statusCode).toBe(503)
    expect(workflow.json<ErrorPayload>().error.code).toBe(
      'RUNTIME_AGENTS_NOT_CONFIGURED',
    )
  })

  it('stores an active label ontology with the authenticated editor approval', async () => {
    const saved = await app.inject({
      method: 'PUT',
      url: '/v1/paper-label-ontologies/paper-label-ontology.v1',
      headers: editorHeaders(),
      payload: {
        id: 'paper-label-ontology.v1',
        version: 1,
        status: 'ACTIVE',
        rules: [
          {
            id: 'relevance',
            kind: 'SEMANTIC',
            label: 'Relevant',
            description: 'Matches the approved editorial scope',
            weight: 1,
            examples: ['A frontier model architecture'],
          },
        ],
        acceptanceThreshold: 0.7,
        reviewBand: 0.05,
      },
    })
    const loaded = await app.inject({
      method: 'GET',
      url: '/v1/paper-label-ontologies/paper-label-ontology.v1',
    })
    const changed = await app.inject({
      method: 'PUT',
      url: '/v1/paper-label-ontologies/paper-label-ontology.v1',
      headers: editorHeaders(),
      payload: {
        id: 'paper-label-ontology.v1',
        version: 1,
        status: 'ACTIVE',
        rules: [
          {
            id: 'different-rule',
            kind: 'SEMANTIC',
            label: 'Different',
            description: 'An attempted in-place change',
            weight: 1,
            examples: [],
          },
        ],
        acceptanceThreshold: 0.7,
        reviewBand: 0.05,
      },
    })

    expect(saved.statusCode).toBe(200)
    expect(saved.json<{ data: { approvedBy: string } }>().data.approvedBy).toBe(
      'editor-1',
    )
    expect(loaded.json()).toEqual(saved.json())
    expect(changed.statusCode).toBe(409)
    expect(changed.json<ErrorPayload>().error.code).toBe('ONTOLOGY_IMMUTABLE')
  })
})

function editorHeaders() {
  return {
    authorization: `Bearer ${token}`,
    'x-glyph-actor-id': 'editor-1',
  }
}

function sourcePayload() {
  return {
    name: 'Example Lab',
    kind: 'LAB',
    baseUrl: 'https://example.com/research',
    enabled: true,
    priority: 90,
    rights: 'PUBLIC_REUSE_ALLOWED',
    connectorKey: 'example-lab',
    editorialNotes: null,
  }
}
