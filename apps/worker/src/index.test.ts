import { describe, expect, it } from 'vitest'

import { InMemoryGlyphRepository } from '@glyph/database'

import { GlyphWorker } from './index.js'

describe('GlyphWorker', () => {
  it('uses a deterministic idempotency key per workflow version', async () => {
    const worker = new GlyphWorker(new InMemoryGlyphRepository())
    const first = await worker.run({
      paperVersionId: 'version-1',
      stage: 'PARSE',
      workflowVersion: 'v1',
    })
    const second = await worker.run({
      paperVersionId: 'version-1',
      stage: 'PARSE',
      workflowVersion: 'v1',
    })

    expect(first.status).toBe('SUCCEEDED')
    expect(second).toEqual(first)
  })
})
