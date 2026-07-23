import { randomUUID } from 'node:crypto'
import { OpenAiResponsesGateway } from '@glyph/ai'
import type {
  AiGenerationGateway,
  QuestionGenerationAuditStore,
  QuestionQuotaGateway,
} from '@glyph/application'
import {
  AiCitedAnswerOutputSchema,
  AiGenerationRecordSchema,
} from '@glyph/domain'
import {
  reportQuestionMaxLength,
  reportQuestionMinLength,
  type ReportQuestionResponse,
} from '../lib/kimi-question-contract'
import { evidenceForPaperVersion } from '../lib/report-catalog'
import { reportPackageBySlug } from './report-packages'
import {
  LocalQuestionGenerationAuditStore,
  localQuestionQuotaGateway,
  perIpDailyLimit,
  perSessionReportDailyLimit,
} from './question-quota'

export type ReportQuestionErrorCode =
  | 'REPORT_NOT_FOUND'
  | 'INVALID_QUESTION'
  | 'QUESTION_QUOTA_EXCEEDED'
  | 'LIVE_AI_UNAVAILABLE'
  | 'EVIDENCE_VALIDATION_FAILED'

export class ReportQuestionRequestError extends Error {
  constructor(
    readonly code: ReportQuestionErrorCode,
    readonly status: 400 | 404 | 429 | 502 | 503,
    readonly retryAfterSeconds: number | null = null,
  ) {
    super(code)
    this.name = 'ReportQuestionRequestError'
  }
}

type Dependencies = {
  gateway: Pick<AiGenerationGateway, 'answerQuestion'>
  quotaGateway: QuestionQuotaGateway
  auditStore: QuestionGenerationAuditStore
  environment: NodeJS.ProcessEnv
  now: () => Date
}

export async function answerReportQuestion(
  slug: string,
  payload: unknown,
  requestContext: { sessionId: string; ipAddress: string },
  dependencyOverrides: Partial<Dependencies> = {},
): Promise<ReportQuestionResponse> {
  const now = dependencyOverrides.now ?? (() => new Date())
  const environment = dependencyOverrides.environment ?? process.env
  const reportPackage = await reportPackageBySlug(slug)
  if (!reportPackage || reportPackage.status !== 'APPROVED') {
    throw new ReportQuestionRequestError('REPORT_NOT_FOUND', 404)
  }
  const question = parseReportQuestion(payload)
  assertLiveAiConfigured(environment)
  const evidenceSpans = evidenceForPaperVersion(reportPackage.paperVersionId)
  if (evidenceSpans.length === 0) {
    throw new ReportQuestionRequestError('EVIDENCE_VALIDATION_FAILED', 502)
  }
  const quotaGateway =
    dependencyOverrides.quotaGateway ?? localQuestionQuotaGateway()
  const quota = await quotaGateway.reserve({
    reportSlug: slug,
    sessionId: requestContext.sessionId,
    ipAddress: requestContext.ipAddress,
    now: now(),
  })
  if (!quota.allowed) {
    throw new ReportQuestionRequestError(
      'QUESTION_QUOTA_EXCEEDED',
      429,
      quota.retryAfterSeconds,
    )
  }

  const requestId = `question-${randomUUID()}`
  const startedAt = Date.now()
  const auditStore =
    dependencyOverrides.auditStore ?? new LocalQuestionGenerationAuditStore()
  try {
    const generation = AiGenerationRecordSchema.parse(
      await withTimeout(
        (
          dependencyOverrides.gateway ?? new OpenAiResponsesGateway()
        ).answerQuestion({
          reportId: reportPackage.id,
          question,
          evidenceSpans,
        }),
        20_000,
      ),
    )
    if (
      generation.task !== 'answer-question' ||
      generation.sourcePaperVersionId !== reportPackage.paperVersionId
    ) {
      throw new ReportQuestionRequestError('EVIDENCE_VALIDATION_FAILED', 502)
    }
    const result = AiCitedAnswerOutputSchema.parse(generation.result)
    const permittedIds = new Set(evidenceSpans.map((span) => span.id))
    if (result.evidenceSpanIds.some((id) => !permittedIds.has(id))) {
      throw new ReportQuestionRequestError('EVIDENCE_VALIDATION_FAILED', 502)
    }
    await quotaGateway.complete(quota.reservation.id)
    await auditStore.record({
      id: requestId,
      reportSlug: slug,
      sessionId: requestContext.sessionId,
      ipAddress: requestContext.ipAddress,
      model: generation.model,
      promptVersion: generation.promptVersion,
      outputSchemaVersion: generation.outputSchemaVersion,
      sourcePaperVersionId: reportPackage.paperVersionId,
      generatedAt: generation.generatedAt,
      outcome: result.outcome,
      evidenceIds: result.evidenceSpanIds,
      latencyMs: Date.now() - startedAt,
      inputTokens: null,
      outputTokens: null,
    })

    return {
      outcome: result.outcome,
      answerText: result.answerText,
      evidenceIds: result.evidenceSpanIds,
      model: generation.model,
      timestamp: generation.generatedAt,
      requestId,
      quota: {
        sessionReportDailyLimit: perSessionReportDailyLimit,
        ipDailyLimit: perIpDailyLimit,
      },
    }
  } catch (error) {
    // Once a provider request has started it may incur cost even if it times
    // out or returns an invalid payload. Count that attempt against the public
    // quota so repeated failures cannot create unbounded spend.
    await quotaGateway.complete(quota.reservation.id)
    await auditStore.record({
      id: requestId,
      reportSlug: slug,
      sessionId: requestContext.sessionId,
      ipAddress: requestContext.ipAddress,
      model: environment.OPENAI_MODEL?.trim() || 'unavailable',
      promptVersion: 'glyph-v1',
      outputSchemaVersion: 1,
      sourcePaperVersionId: reportPackage.paperVersionId,
      generatedAt: now().toISOString(),
      outcome:
        error instanceof ReportQuestionRequestError &&
        error.code === 'LIVE_AI_UNAVAILABLE'
          ? 'LIVE_AI_UNAVAILABLE'
          : 'FAILED',
      evidenceIds: [],
      latencyMs: Date.now() - startedAt,
      inputTokens: null,
      outputTokens: null,
    })
    if (error instanceof ReportQuestionRequestError) throw error
    if (error instanceof Error && error.message === 'QUESTION_TIMEOUT') {
      throw new ReportQuestionRequestError('LIVE_AI_UNAVAILABLE', 503)
    }
    throw new ReportQuestionRequestError('EVIDENCE_VALIDATION_FAILED', 502)
  }
}

export function parseReportQuestion(payload: unknown): string {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    Array.isArray(payload)
  ) {
    throw new ReportQuestionRequestError('INVALID_QUESTION', 400)
  }
  const record = payload as Record<string, unknown>
  if (
    Object.keys(record).some((key) => key !== 'question') ||
    typeof record.question !== 'string'
  ) {
    throw new ReportQuestionRequestError('INVALID_QUESTION', 400)
  }
  const question = record.question.trim().replace(/\s+/gu, ' ')
  if (
    question.length < reportQuestionMinLength ||
    question.length > reportQuestionMaxLength ||
    [...question].some((character) => {
      const code = character.charCodeAt(0)
      return code < 32 || code === 127
    })
  ) {
    throw new ReportQuestionRequestError('INVALID_QUESTION', 400)
  }
  return question
}

function assertLiveAiConfigured(environment: NodeJS.ProcessEnv): void {
  if (
    environment.GLYPH_ENABLE_LIVE_AI !== 'true' ||
    !environment.OPENAI_API_KEY?.trim() ||
    !environment.OPENAI_MODEL?.trim()
  ) {
    throw new ReportQuestionRequestError('LIVE_AI_UNAVAILABLE', 503)
  }
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error('QUESTION_TIMEOUT')),
          timeoutMs,
        )
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}
