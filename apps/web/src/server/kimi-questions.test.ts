import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { POST } from '../app/api/reports/[slug]/questions/route'
import { kimiEvidenceMappings } from '../lib/kimi-reader-content'
import {
  KimiQuestionRequestError,
  answerKimiQuestion,
  buildKimiEvidenceCorpus,
  kimiReportId,
  parseKimiQuestion,
} from './kimi-questions'

const configuredEnvironment = {
  NODE_ENV: 'test',
  GLYPH_ENABLE_LIVE_AI: 'true',
  OPENAI_API_KEY: 'test-key-not-used-by-stub',
  OPENAI_MODEL: 'test-model',
} satisfies NodeJS.ProcessEnv

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('Kimi evidence-bound questions', () => {
  it('builds the complete corpus only from checked Kimi mappings', () => {
    const corpus = buildKimiEvidenceCorpus()
    expect(corpus.map((span) => span.id)).toEqual(
      Object.keys(kimiEvidenceMappings),
    )
    expect(corpus).toHaveLength(2)
    for (const span of corpus) {
      const mapping =
        kimiEvidenceMappings[span.id as keyof typeof kimiEvidenceMappings]
      expect(span).toMatchObject({
        pageNumber: mapping.pageNumber,
        exactText: mapping.exactText,
        boxes: mapping.boxes,
      })
    }
    expect(new Set(corpus.map((span) => span.paperVersionId)).size).toBe(1)
  })

  it('normalizes bounded input and rejects malformed questions', () => {
    expect(parseKimiQuestion({ question: '  What   is supported?  ' })).toBe(
      'What is supported?',
    )
    expect(() => parseKimiQuestion({ question: 'x' })).toThrow(
      KimiQuestionRequestError,
    )
    expect(() =>
      parseKimiQuestion({ question: 'Valid?', extra: true }),
    ).toThrow(KimiQuestionRequestError)
    expect(() => parseKimiQuestion({ question: 'x'.repeat(501) })).toThrow(
      KimiQuestionRequestError,
    )
  })

  it('returns only a validated answer contract from the gateway', async () => {
    await expect(
      answerKimiQuestion(
        'kimi-k3',
        { question: 'What does Kimi claim about routing?' },
        {
          environment: configuredEnvironment,
          gateway: {
            answerQuestion: (input) => {
              expect(input.reportId).toBe(kimiReportId)
              expect(input.evidenceSpans).toHaveLength(2)
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
      ),
    ).resolves.toEqual({
      outcome: 'ANSWER',
      answerText: 'Moonshot claims 16 of 896 experts are active.',
      evidenceIds: ['evidence-routing'],
      model: 'test-model',
      timestamp: '2026-07-22T00:00:00.000Z',
    })
  })

  it('rejects citations outside the mapped corpus even after gateway output', async () => {
    await expect(
      answerKimiQuestion(
        'kimi-k3',
        { question: 'What is supported?' },
        {
          environment: configuredEnvironment,
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
    ).rejects.toThrow('INVALID_QUESTION_CITATION')
  })

  it('maps unknown, invalid, and disabled API requests without provider detail', async () => {
    const unknown = await POST(
      new Request('http://local/api/reports/unknown/questions', {
        method: 'POST',
        body: JSON.stringify({ question: 'What is supported?' }),
      }),
      { params: Promise.resolve({ slug: 'unknown' }) },
    )
    expect(unknown.status).toBe(404)
    expect(await unknown.json()).toEqual({
      error: { code: 'REPORT_NOT_FOUND' },
    })

    const invalid = await POST(
      new Request('http://local/api/reports/kimi-k3/questions', {
        method: 'POST',
        body: JSON.stringify({ question: '' }),
      }),
      { params: Promise.resolve({ slug: 'kimi-k3' }) },
    )
    expect(invalid.status).toBe(400)

    vi.stubEnv('GLYPH_ENABLE_LIVE_AI', 'false')
    const disabled = await POST(
      new Request('http://local/api/reports/kimi-k3/questions', {
        method: 'POST',
        body: JSON.stringify({ question: 'What is supported?' }),
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
    expect(source).not.toMatch(/from ['"]openai['"]/)
  })
})
