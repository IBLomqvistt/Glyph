import { OpenAiResponsesGateway } from '@glyph/ai'
import type { AiGenerationGateway } from '@glyph/application'
import {
  AiCitedAnswerOutputSchema,
  AiGenerationRecordSchema,
  EvidenceSpanSchema,
  schemaVersion,
  type EvidenceSpan,
} from '@glyph/domain'
import {
  kimiQuestionMaxLength,
  kimiQuestionMinLength,
  type KimiQuestionResponse,
} from '../lib/kimi-question-contract'
import {
  kimiEvidenceMappings,
  kimiPaperVersionId,
} from '../lib/kimi-reader-content'

export const kimiReportSlug = 'kimi-k3'
export const kimiReportId = 'report-kimi-k3-2026-07-21'

export type KimiQuestionErrorCode =
  'REPORT_NOT_FOUND' | 'INVALID_QUESTION' | 'LIVE_AI_UNAVAILABLE'

export class KimiQuestionRequestError extends Error {
  constructor(
    readonly code: KimiQuestionErrorCode,
    readonly status: 400 | 404 | 503,
  ) {
    super(code)
    this.name = 'KimiQuestionRequestError'
  }
}

export function isKimiReportSlug(slug: string): boolean {
  return slug === kimiReportSlug
}

export function buildKimiEvidenceCorpus(): EvidenceSpan[] {
  return Object.entries(kimiEvidenceMappings).map(([id, mapping]) =>
    EvidenceSpanSchema.parse({
      schemaVersion,
      id,
      paperVersionId: kimiPaperVersionId,
      pageNumber: mapping.pageNumber,
      section: 'Kimi K3 launch post',
      exactText: mapping.exactText,
      boxes: mapping.boxes,
    }),
  )
}

export function parseKimiQuestion(payload: unknown): string {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    Array.isArray(payload)
  ) {
    throw new KimiQuestionRequestError('INVALID_QUESTION', 400)
  }
  const record = payload as Record<string, unknown>
  if (
    Object.keys(record).some((key) => key !== 'question') ||
    typeof record.question !== 'string'
  ) {
    throw new KimiQuestionRequestError('INVALID_QUESTION', 400)
  }
  const question = record.question.trim().replace(/\s+/g, ' ')
  if (
    question.length < kimiQuestionMinLength ||
    question.length > kimiQuestionMaxLength ||
    [...question].some((character) => {
      const code = character.charCodeAt(0)
      return code < 32 || code === 127
    })
  ) {
    throw new KimiQuestionRequestError('INVALID_QUESTION', 400)
  }
  return question
}

function assertLiveAiConfigured(environment: NodeJS.ProcessEnv): void {
  if (
    environment.GLYPH_ENABLE_LIVE_AI !== 'true' ||
    !environment.OPENAI_API_KEY?.trim() ||
    !environment.OPENAI_MODEL?.trim()
  ) {
    throw new KimiQuestionRequestError('LIVE_AI_UNAVAILABLE', 503)
  }
}

export async function answerKimiQuestion(
  slug: string,
  payload: unknown,
  dependencies: {
    gateway?: Pick<AiGenerationGateway, 'answerQuestion'>
    environment?: NodeJS.ProcessEnv
  } = {},
): Promise<KimiQuestionResponse> {
  if (!isKimiReportSlug(slug)) {
    throw new KimiQuestionRequestError('REPORT_NOT_FOUND', 404)
  }
  const question = parseKimiQuestion(payload)
  assertLiveAiConfigured(dependencies.environment ?? process.env)
  const evidenceSpans = buildKimiEvidenceCorpus()
  const generation = AiGenerationRecordSchema.parse(
    await (dependencies.gateway ?? new OpenAiResponsesGateway()).answerQuestion(
      {
        reportId: kimiReportId,
        question,
        evidenceSpans,
      },
    ),
  )
  if (
    generation.task !== 'answer-question' ||
    generation.sourcePaperVersionId !== kimiPaperVersionId
  ) {
    throw new Error('INVALID_QUESTION_GENERATION')
  }
  const result = AiCitedAnswerOutputSchema.parse(generation.result)
  const permittedIds = new Set(evidenceSpans.map((span) => span.id))
  if (result.evidenceSpanIds.some((id) => !permittedIds.has(id))) {
    throw new Error('INVALID_QUESTION_CITATION')
  }

  return {
    outcome: result.outcome,
    answerText: result.answerText,
    evidenceIds: result.evidenceSpanIds,
    model: generation.model,
    timestamp: generation.generatedAt,
  }
}
