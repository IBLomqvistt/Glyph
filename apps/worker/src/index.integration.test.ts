import { describe, expect, it, vi } from 'vitest'
import { fileURLToPath } from 'node:url'
import { InMemoryPipelineRunRepository } from '@glyph/application'
import { LocalJobRunner, runDemoPipeline } from './index'
import { LocalFixtureAssetStore } from './local-asset-store'

describe('local pipeline', () => {
  it('completes every safe pre-approval stage', async () => {
    const repository = new InMemoryPipelineRunRepository()
    const runner = new LocalJobRunner(
      repository,
      () => '2026-07-21T00:00:00.000Z',
    )
    const results = await runDemoPipeline({
      paperVersionId: 'version-demo',
      runner,
    })
    expect(results).toHaveLength(10)
    expect(results.every((run) => run.status === 'SUCCEEDED')).toBe(true)
  })

  it('replays a completed idempotency key without duplicate effects', async () => {
    const repository = new InMemoryPipelineRunRepository()
    const runner = new LocalJobRunner(
      repository,
      () => '2026-07-21T00:00:00.000Z',
    )
    const effect = vi.fn(() => Promise.resolve({ ok: true }))
    const input = {
      paperVersionId: 'version-demo',
      stage: 'PARSE' as const,
      idempotencyKey: 'version-demo:PARSE:v1',
      effect,
    }
    const first = await runner.runStage(input)
    const replay = await runner.runStage(input)
    expect(replay).toEqual(first)
    expect(effect).toHaveBeenCalledTimes(1)
  })

  it('increments the attempt after a structured failure', async () => {
    const repository = new InMemoryPipelineRunRepository()
    const runner = new LocalJobRunner(
      repository,
      () => '2026-07-21T00:00:00.000Z',
    )
    const idempotencyKey = 'version-demo:PARSE:retry'
    const failed = await runner.runStage({
      paperVersionId: 'version-demo',
      stage: 'PARSE',
      idempotencyKey,
      effect: () => Promise.reject(new Error('Synthetic parser failure')),
    })
    const retried = await runner.runStage({
      paperVersionId: 'version-demo',
      stage: 'PARSE',
      idempotencyKey,
      effect: () => Promise.resolve({ recovered: true }),
    })
    expect(failed.status).toBe('FAILED')
    expect(retried.status).toBe('SUCCEEDED')
    expect(retried.attempt).toBe(2)
  })

  it('reads only explicitly mapped local fixture assets', async () => {
    const fixturePath = new URL(
      '../../../fixtures/glyph-agent-swarm-demo/paper.pdf',
      import.meta.url,
    )
    const store = new LocalFixtureAssetStore(
      new Map([['glyph-agent-swarm-demo-v1', fileURLToPath(fixturePath)]]),
    )
    expect(
      (await store.getPdfBytes('glyph-agent-swarm-demo-v1'))?.length,
    ).toBeGreaterThan(0)
    await expect(store.getPdfBytes('unknown-version')).resolves.toBeNull()
  })
})
