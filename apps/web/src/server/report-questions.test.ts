import { readFileSync } from 'node:fs'
import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type {
  QuestionGenerationAuditRecord,
  QuestionGenerationAuditStore,
} from '@glyph/application'
import { POST } from '../app/api/reports/[slug]/questions/route'
import { kimiEvidenceSpans } from '../lib/report-catalog'
import { InMemoryQuestionQuotaGateway } from './question-quota'
import {
  ReportQuestionRequestError,
  answerReportQuestion,
  parseReportQuestion,
} from './report-questions'

const configuredEnvironment = {
  NODE_ENV: 'test',
  GLYPH_ENABLE_LIVE_AI: 'true',
  OPENAI_API_KEY: 'test-key-not-used-by-stub',
  OPENAI_MODEL: 'test-model',
} satisfies NodeJS.ProcessEnv

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('report evidence-bound questions', () => {
  it('provides the expanded checked Kimi corpus', () => {
    expect(kimiEvidenceSpans).toHaveLength(10)
    expect(kimiEvidenceSpans.map((span) => span.id)).toEqual(
      expect.arrayContaining([
        'evidence-kda-attnres',
        'evidence-routing-stability',
        'evidence-quantization',
        'evidence-serving-system',
        'evidence-api-economics',
        'evidence-benchmark-harness',
      ]),
    )
    expect(
      new Set(kimiEvidenceSpans.map((span) => span.paperVersionId)).size,
    ).toBe(1)
  })

  it('normalizes bounded input and rejects malformed questions', () => {
    expect(parseReportQuestion({ question: '  What   is supported?  ' })).toBe(
      'What is supported?',
    )
    expect(() => parseReportQuestion({ question: 'x' })).toThrow(
      ReportQuestionRequestError,
    )
    expect(() =>
      parseReportQuestion({ question: 'Valid?', extra: true }),
    ).toThrow(ReportQuestionRequestError)
    expect(() => parseReportQuestion({ question: 'x'.repeat(501) })).toThrow(
      ReportQuestionRequestError,
    )
  })

  it('returns only a validated answer contract and records the request', async () => {
    const audit = auditRecorder()
    const response = await answerReportQuestion(
      'kimi-k3',
      { question: 'What does Kimi claim about routing?' },
      { sessionId: 'session-answer', ipAddress: '203.0.113.10' },
      {
        environment: configuredEnvironment,
        now: () => new Date('2026-07-22T00:00:00.000Z'),
        quotaGateway: quotaGateway(),
        auditStore: audit.store,
        gateway: {
          answerQuestion: (input) => {
            expect(input.evidenceSpans).toHaveLength(10)
            return Promise.resolve({
              schemaVersion: 1,
              task: 'answer-question',
              model: 'test-model',
              promptVersion: 'test-prompt',
              outputSchemaVersion: 1,
              generatedAt: '2026-07-22T00:00:00.000Z',
              sourcePaperVersionId: input.evidenceSpans[0]!.paperVersionId,
              result: {
                outcome: 'ANSWER',
                answerText: 'Moonshot claims 16 of 896 experts are active.',
                evidenceSpanIds: ['evidence-routing'],
              },
            })
          },
        },
      },
    )
    expect(response).toMatchObject({
      outcome: 'ANSWER',
      answerText: 'Moonshot claims 16 of 896 experts are active.',
      evidenceIds: ['evidence-routing'],
      model: 'test-model',
      timestamp: '2026-07-22T00:00:00.000Z',
      quota: { sessionReportDailyLimit: 5, ipDailyLimit: 30 },
    })
    expect(response.requestId).toMatch(/^question-/u)
    expect(audit.records).toEqual([
      expect.objectContaining({
        outcome: 'ANSWER',
        evidenceIds: ['evidence-routing'],
      }),
    ])
  })

  it('fails closed when a gateway cites outside the validated corpus', async () => {
    await expect(
      answerReportQuestion(
        'kimi-k3',
        { question: 'What is supported?' },
        { sessionId: 'session-invalid', ipAddress: '203.0.113.10' },
        {
          environment: configuredEnvironment,
          quotaGateway: quotaGateway(),
          auditStore: auditRecorder().store,
          gateway: {
            answerQuestion: (input) =>
              Promise.resolve({
                schemaVersion: 1,
                task: 'answer-question',
                model: 'test-model',
                promptVersion: 'test-prompt',
                outputSchemaVersion: 1,
                generatedAt: '2026-07-22T00:00:00.000Z',
                sourcePaperVersionId: input.evidenceSpans[0]!.paperVersionId,
                result: {
                  outcome: 'ANSWER',
                  answerText: 'Unsupported.',
                  evidenceSpanIds: ['invented-evidence'],
                },
              }),
          },
        },
      ),
    ).rejects.toMatchObject({ code: 'EVIDENCE_VALIDATION_FAILED', status: 502 })
  })

  it('maps unknown, invalid, and disabled API requests without provider detail', async () => {
    const unknown = await POST(
      request('http://local/api/reports/unknown/questions', {
        question: 'What is supported?',
      }),
      { params: Promise.resolve({ slug: 'unknown' }) },
    )
    expect(unknown.status).toBe(404)
    expect(await unknown.json()).toEqual({
      error: { code: 'REPORT_NOT_FOUND' },
    })

    const invalid = await POST(
      request('http://local/api/reports/kimi-k3/questions', { question: '' }),
      { params: Promise.resolve({ slug: 'kimi-k3' }) },
    )
    expect(invalid.status).toBe(400)

    vi.stubEnv('GLYPH_ENABLE_LIVE_AI', 'false')
    const disabled = await POST(
      request('http://local/api/reports/kimi-k3/questions', {
        question: 'What is supported?',
      }),
      { params: Promise.resolve({ slug: 'kimi-k3' }) },
    )
    expect(disabled.status).toBe(503)
    expect(disabled.headers.get('Cache-Control')).toBe('no-store')
    expect(await disabled.json()).toEqual({
      error: { code: 'LIVE_AI_UNAVAILABLE' },
    })
  })

  it('keeps OpenAI credentials and provider code out of the client component', () => {
    const source = readFileSync(
      new URL('../components/kimi-question-panel.tsx', import.meta.url),
      'utf8',
    )
    expect(source).not.toContain('OPENAI_API_KEY')
    expect(source).not.toContain('@glyph/ai')
    expect(source).not.toMatch(/from ['"]openai['"]/u)
  })
})

function quotaGateway(): InMemoryQuestionQuotaGateway {
  return new InMemoryQuestionQuotaGateway({
    sessionCounts: new Map(),
    ipCounts: new Map(),
    activeSessionIds: new Set(),
    reservations: new Map(),
  })
}

function auditRecorder(): {
  store: QuestionGenerationAuditStore
  records: QuestionGenerationAuditRecord[]
} {
  const records: QuestionGenerationAuditRecord[] = []
  return {
    records,
    store: { record: (entry) => Promise.resolve(void records.push(entry)) },
  }
}

function request(url: string, payload: unknown): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
