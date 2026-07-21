import { describe, expect, it, vi } from 'vitest'

import {
  OpenAiEvidenceDrafter,
  defaultOpenAiModel,
  type EvidenceDraftInput,
} from './index.js'

const input: EvidenceDraftInput = {
  paperTitle: 'Synthetic paper',
  investorQuestion: 'Does the mechanism change inference economics?',
  evidence: [
    {
      id: 'span-1',
      pageNumber: 4,
      exactText: 'The controller maps requests to three compute budgets.',
    },
  ],
}

describe('OpenAiEvidenceDrafter', () => {
  it('uses GPT-5.6 Terra and strict structured output without storing the response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      response({
        executiveSummary: 'The mechanism routes requests by difficulty.',
        claims: [
          {
            text: 'The controller selects among three budgets.',
            supportStatus: 'SUPPORTED',
            evidenceSpanIds: ['span-1'],
            limitation: 'The excerpt does not establish production savings.',
          },
        ],
        openQuestions: ['Does the controller generalize?'],
      }),
    )
    const drafter = new OpenAiEvidenceDrafter({
      apiKey: 'test-key',
      fetchImpl,
    })

    const result = await drafter.draft(input)

    expect(result).toMatchObject({
      responseId: 'resp_test',
      model: defaultOpenAiModel,
      draft: { claims: [{ evidenceSpanIds: ['span-1'] }] },
    })
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.openai.com/v1/responses')
    expect(init.headers).toMatchObject({
      authorization: 'Bearer test-key',
    })
    if (typeof init.body !== 'string') {
      throw new Error('Expected a JSON request body')
    }
    const body = JSON.parse(init.body) as Record<string, unknown>
    expect(body).toMatchObject({
      model: defaultOpenAiModel,
      store: false,
      reasoning: { effort: 'low' },
      text: {
        verbosity: 'low',
        format: { type: 'json_schema', strict: true },
      },
    })
  })

  it('rejects evidence IDs that were not supplied', async () => {
    const drafter = new OpenAiEvidenceDrafter({
      apiKey: 'test-key',
      fetchImpl: vi.fn().mockResolvedValue(
        response({
          executiveSummary: 'A draft.',
          claims: [
            {
              text: 'An unsupported mapping.',
              supportStatus: 'SUPPORTED',
              evidenceSpanIds: ['invented-span'],
              limitation: 'No limitation supplied by the evidence.',
            },
          ],
          openQuestions: ['What supports this?'],
        }),
      ),
    })

    await expect(drafter.draft(input)).rejects.toThrow(
      'unknown evidence span invented-span',
    )
  })

  it('surfaces structured refusals', async () => {
    const drafter = new OpenAiEvidenceDrafter({
      apiKey: 'test-key',
      fetchImpl: vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () =>
          Promise.resolve({
            id: 'resp_refusal',
            model: defaultOpenAiModel,
            output: [
              {
                type: 'message',
                content: [{ type: 'refusal', refusal: 'Cannot process input' }],
              },
            ],
          }),
      }),
    })

    await expect(drafter.draft(input)).rejects.toThrow(
      'OpenAI response was refused',
    )
  })

  it('reports HTTP failures without logging response content', async () => {
    const drafter = new OpenAiEvidenceDrafter({
      apiKey: 'test-key',
      fetchImpl: vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ 'x-request-id': 'req_rate_limited' }),
        json: () => Promise.resolve({ error: { message: 'sensitive detail' } }),
      }),
    })

    await expect(drafter.draft(input)).rejects.toThrow(
      'status 429 (request req_rate_limited)',
    )
  })
})

function response(draft: unknown) {
  return {
    ok: true,
    status: 200,
    headers: new Headers(),
    json: () =>
      Promise.resolve({
        id: 'resp_test',
        model: defaultOpenAiModel,
        output: [
          {
            type: 'message',
            content: [{ type: 'output_text', text: JSON.stringify(draft) }],
          },
        ],
      }),
  }
}
