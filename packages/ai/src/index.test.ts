import { describe, expect, it } from 'vitest'
import {
  DeterministicAiGateway,
  ExternalAiDisabledError,
  OpenAiImageGateway,
  OpenAiResponsesGateway,
  buildQuoteMatchingAgentPrompt,
  buildReportAgentPrompt,
  getOpenAiClient,
  reportAgentSections,
} from './index'

describe('AI safety boundary', () => {
  it('fails closed instead of initializing a live client by default', () => {
    delete process.env.GLYPH_ENABLE_LIVE_AI
    expect(() => getOpenAiClient()).toThrow(ExternalAiDisabledError)
  })

  it('uses insufficient evidence for an unconstrained mock answer', async () => {
    const generation = await new DeterministicAiGateway().answerQuestion({
      reportId: 'report-demo',
      question: 'Does this imply a trade?',
      evidenceSpans: [],
    })
    expect(generation.task).toBe('answer-question')
    expect(generation.result).toMatchObject({
      outcome: 'INSUFFICIENT_EVIDENCE',
      answerText: null,
      evidenceSpanIds: [],
    })
  })

  it('validates the Responses adapter through a mocked transport only', async () => {
    process.env.OPENAI_MODEL = 'test-model'
    const gateway = new OpenAiResponsesGateway(
      {
        create: () =>
          Promise.resolve({
            output_text: JSON.stringify({
              schemaVersion: 1,
              result: {
                label: 'SYNTHETIC_DEMO',
                rationale: 'Controlled fixture classification.',
              },
            }),
          }),
      },
      () => '2026-07-21T00:00:00.000Z',
    )
    await expect(
      gateway.classify({
        title: 'Synthetic title',
        abstract: 'Synthetic abstract',
      }),
    ).resolves.toMatchObject({
      schemaVersion: 1,
      task: 'classify',
      model: 'test-model',
      promptVersion: 'glyph-v1',
      generatedAt: '2026-07-21T00:00:00.000Z',
      result: {
        label: 'SYNTHETIC_DEMO',
        rationale: 'Controlled fixture classification.',
      },
    })
    delete process.env.OPENAI_MODEL
  })

  it('rejects malformed or extra task output fields at the boundary', async () => {
    process.env.OPENAI_MODEL = 'test-model'
    const gateway = new OpenAiResponsesGateway({
      create: () =>
        Promise.resolve({
          output_text: JSON.stringify({
            schemaVersion: 1,
            result: {
              label: 'SYNTHETIC_DEMO',
              rationale: 'Fixture.',
              inventedEvidenceId: 'plausible-looking-fallback',
            },
          }),
        }),
    })
    await expect(
      gateway.classify({ title: 'Synthetic', abstract: 'Synthetic' }),
    ).rejects.toThrow()
    delete process.env.OPENAI_MODEL
  })

  it('rejects cited answers that escape the supplied corpus', async () => {
    process.env.OPENAI_MODEL = 'test-model'
    const gateway = new OpenAiResponsesGateway({
      create: () =>
        Promise.resolve({
          output_text: JSON.stringify({
            schemaVersion: 1,
            result: {
              outcome: 'ANSWER',
              answerText: 'A plausible but unsupported answer.',
              evidenceSpanIds: ['invented-evidence'],
            },
          }),
        }),
    })
    await expect(
      gateway.answerQuestion({
        reportId: 'report-demo',
        question: 'What is supported?',
        evidenceSpans: [],
      }),
    ).rejects.toThrow('outside the supplied corpus')
    delete process.env.OPENAI_MODEL
  })

  it('generates only a review-required non-semantic image draft', async () => {
    process.env.OPENAI_MODEL_ILLUSTRATION = 'test-image-model'
    let capturedPrompt = ''
    const gateway = new OpenAiImageGateway(
      {
        generate: (request) => {
          capturedPrompt = request.prompt
          expect(request).toMatchObject({
            model: 'test-image-model',
            n: 1,
            size: '1024x1024',
            quality: 'low',
            background: 'opaque',
            output_format: 'png',
            moderation: 'auto',
          })
          return Promise.resolve({
            data: [{ b64_json: 'c3ludGhldGljLWltYWdl' }],
          })
        },
      },
      () => '2026-07-21T00:00:00.000Z',
    )

    await expect(
      gateway.generateDraft({
        paperVersionId: 'version-demo',
        purpose: 'VISUAL_ABSTRACT',
        brief: 'An elegant violet atmosphere around parallel exploration.',
      }),
    ).resolves.toMatchObject({
      paperVersionId: 'version-demo',
      purpose: 'VISUAL_ABSTRACT',
      model: 'test-image-model',
      promptVersion: 'glyph-illustration-v1',
      mimeType: 'image/png',
      reviewStatus: 'PENDING_HUMAN_REVIEW',
      semanticUseAllowed: false,
    })
    expect(capturedPrompt).toContain('untrusted styling input only')
    expect(capturedPrompt).toContain(
      'Do not include text, letters, numbers, equations, labels, arrows, charts, diagrams',
    )
    expect(capturedPrompt).toContain('decorative only')
    delete process.env.OPENAI_MODEL_ILLUSTRATION
  })

  it('fails explicitly when the image provider returns no bytes', async () => {
    const gateway = new OpenAiImageGateway({
      generate: () => Promise.resolve({ data: [] }),
    })
    await expect(
      gateway.generateDraft({
        paperVersionId: 'version-demo',
        purpose: 'EDITORIAL_ACCENT',
        brief: 'A restrained abstract violet light field for an article.',
      }),
    ).rejects.toThrow('OPENAI_IMAGE_OUTPUT_MISSING')
  })

  it('defines the required report structure and evidence-first guardrails', () => {
    const prompt = buildReportAgentPrompt({
      paperVersionId: 'version-demo',
      title: 'Synthetic title',
      authors: ['Fixture author'],
      publicationDate: '2026-07-21',
      originalUrl: null,
      evidenceCorpus: [
        {
          id: 'evidence-1',
          paperVersionId: 'version-demo',
          pageNumber: 1,
          section: 'Abstract',
          exactText: 'A bounded synthetic passage.',
        },
      ],
    })

    expect(reportAgentSections).toEqual([
      'Executive summary',
      'Background and current landscape',
      'Mechanism in plain English',
      'Technical evidence',
      'Why this matters for the AI frontier',
      'Why this matters for the AI trade',
    ])
    expect(prompt).toContain('INSUFFICIENT_EVIDENCE')
    expect(prompt).toContain('No direct trade implication')
    expect(prompt).toContain('training, prefill, per-token decoding')
    expect(prompt).toContain('requires human editorial approval')
  })

  it('makes quote matching fail closed and rejects mixed versions', () => {
    const input = {
      paperVersionId: 'version-demo',
      claims: [
        {
          id: 'claim-1',
          text: 'A bounded synthetic claim.',
          kind: 'PAPER_FACT' as const,
        },
      ],
      evidenceCorpus: [
        {
          id: 'evidence-1',
          paperVersionId: 'version-demo',
          pageNumber: 1,
          section: 'Abstract',
          exactText: 'A bounded synthetic passage.',
        },
      ],
    }

    const prompt = buildQuoteMatchingAgentPrompt(input)
    expect(prompt).toContain('INSUFFICIENT_EVIDENCE')
    expect(prompt).toContain('never estimate them')
    expect(prompt).toContain(
      'Return only evidenceSpanIds present in the corpus',
    )
    expect(() =>
      buildQuoteMatchingAgentPrompt({
        ...input,
        evidenceCorpus: [
          { ...input.evidenceCorpus[0]!, paperVersionId: 'other-version' },
        ],
      }),
    ).toThrow('REPORT_AGENT_EVIDENCE_VERSION_MISMATCH')
  })
})
