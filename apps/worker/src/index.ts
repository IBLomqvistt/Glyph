import type { JobRunner, PipelineRunRepository } from '@glyph/application'
import {
  PipelineRunSchema,
  schemaVersion,
  type Id,
  type PipelineRun,
  type PipelineStage,
} from '@glyph/domain'

type StageEffect = () => Promise<Record<string, unknown>>

export class LocalJobRunner implements JobRunner {
  constructor(
    private readonly runs: PipelineRunRepository,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async runStage(input: {
    paperVersionId: Id
    stage: PipelineStage
    idempotencyKey: string
    effect: StageEffect
  }): Promise<PipelineRun> {
    const existing = await this.runs.findByIdempotencyKey(input.idempotencyKey)
    if (existing?.status === 'SUCCEEDED') {
      return existing
    }

    const attempt = (existing?.attempt ?? 0) + 1
    const timestamp = this.now()
    try {
      const result = await input.effect()
      const completed = PipelineRunSchema.parse({
        schemaVersion,
        id: existing?.id ?? `run-${input.idempotencyKey}`,
        paperVersionId: input.paperVersionId,
        stage: input.stage,
        attempt,
        idempotencyKey: input.idempotencyKey,
        status: 'SUCCEEDED',
        result,
        error: null,
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
      })
      await this.runs.save(completed)
      return completed
    } catch (error) {
      const failed = PipelineRunSchema.parse({
        schemaVersion,
        id: existing?.id ?? `run-${input.idempotencyKey}`,
        paperVersionId: input.paperVersionId,
        stage: input.stage,
        attempt,
        idempotencyKey: input.idempotencyKey,
        status: 'FAILED',
        result: null,
        error: {
          code: 'STAGE_FAILED',
          message:
            error instanceof Error ? error.message : 'Unknown stage failure',
        },
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
      })
      await this.runs.save(failed)
      return failed
    }
  }
}

export const demoStages: readonly PipelineStage[] = [
  'DISCOVER',
  'CLASSIFY',
  'RANK',
  'SELECT',
  'PARSE',
  'EXTRACT_EVIDENCE',
  'GENERATE_OUTLINE',
  'GENERATE_REPORT',
  'GENERATE_VISUALS',
  'AUTOMATED_QA',
]

export async function runDemoPipeline(input: {
  paperVersionId: Id
  runner: LocalJobRunner
}): Promise<PipelineRun[]> {
  const results: PipelineRun[] = []
  for (const stage of demoStages) {
    results.push(
      await input.runner.runStage({
        paperVersionId: input.paperVersionId,
        stage,
        idempotencyKey: `${input.paperVersionId}:${stage}:v1`,
        effect: () => Promise.resolve({ synthetic: true, stage }),
      }),
    )
  }
  return results
}
