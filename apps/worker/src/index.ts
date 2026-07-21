import {
  DeferredStageExecutor,
  PipelineService,
  SourceTrackerService,
  type GlyphRepository,
  type RuntimeRepository,
  type SourceConnectorRegistry,
} from '@glyph/application'
import type { PipelineRun, PipelineStage } from '@glyph/domain'
import type { SourceScan } from '@glyph/domain/runtime-agents'

export class GlyphWorker {
  readonly #pipeline: PipelineService

  constructor(repository: GlyphRepository) {
    this.#pipeline = new PipelineService(
      repository,
      new DeferredStageExecutor(),
    )
  }

  run(input: {
    paperVersionId: string
    stage: PipelineStage
    workflowVersion: string
  }): Promise<PipelineRun> {
    return this.#pipeline.run({
      paperVersionId: input.paperVersionId,
      stage: input.stage,
      idempotencyKey: `${input.paperVersionId}:${input.stage}:${input.workflowVersion}`,
    })
  }
}

export class DailySourceScanScheduler {
  readonly #tracker: SourceTrackerService
  readonly #intervalMs: number
  #timer: ReturnType<typeof setInterval> | null = null

  constructor(
    repository: RuntimeRepository,
    connectors: SourceConnectorRegistry,
    intervalMs = 24 * 60 * 60 * 1_000,
  ) {
    this.#tracker = new SourceTrackerService(repository, connectors)
    this.#intervalMs = intervalMs
  }

  runNow(): Promise<SourceScan> {
    return this.#tracker.scan({ trigger: 'SCHEDULED' })
  }

  start(): void {
    if (this.#timer !== null) return
    this.#timer = setInterval(() => {
      void this.runNow()
    }, this.#intervalMs)
    this.#timer.unref()
  }

  stop(): void {
    if (this.#timer === null) return
    clearInterval(this.#timer)
    this.#timer = null
  }
}
