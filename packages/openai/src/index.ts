import { z } from 'zod'

export const defaultOpenAiModel = 'gpt-5.6-terra' as const

export const EvidenceDraftInputSchema = z.object({
  paperTitle: z.string().trim().min(1),
  investorQuestion: z.string().trim().min(1),
  evidence: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        pageNumber: z.number().int().positive(),
        exactText: z.string().trim().min(1),
      }),
    )
    .min(1),
})
export type EvidenceDraftInput = z.infer<typeof EvidenceDraftInputSchema>

const DraftClaimSchema = z
  .object({
    text: z.string().trim().min(1),
    supportStatus: z.enum(['SUPPORTED', 'INSUFFICIENT_EVIDENCE']),
    evidenceSpanIds: z.array(z.string().trim().min(1)),
    limitation: z.string().trim().min(1),
  })
  .superRefine((claim, context) => {
    if (
      claim.supportStatus === 'SUPPORTED' &&
      claim.evidenceSpanIds.length === 0
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Supported claims require at least one evidence span',
        path: ['evidenceSpanIds'],
      })
    }
    if (
      claim.supportStatus === 'INSUFFICIENT_EVIDENCE' &&
      claim.evidenceSpanIds.length > 0
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Insufficient claims cannot cite evidence as support',
        path: ['evidenceSpanIds'],
      })
    }
  })

export const EvidenceDraftSchema = z.object({
  executiveSummary: z.string().trim().min(1),
  claims: z.array(DraftClaimSchema).min(1).max(8),
  openQuestions: z.array(z.string().trim().min(1)).min(1).max(6),
})
export type EvidenceDraft = z.infer<typeof EvidenceDraftSchema>

const ResponseEnvelopeSchema = z.object({
  id: z.string().trim().min(1),
  model: z.string().trim().min(1),
  output: z.array(
    z
      .object({
        type: z.string(),
        content: z
          .array(
            z
              .object({
                type: z.string(),
                text: z.string().optional(),
                refusal: z.string().optional(),
              })
              .passthrough(),
          )
          .optional(),
      })
      .passthrough(),
  ),
})

type FetchLike = (
  input: string,
  init: RequestInit,
) => Promise<Pick<Response, 'ok' | 'status' | 'json' | 'headers'>>

export type OpenAiEvidenceDrafterOptions = {
  apiKey: string
  model?: string
  endpoint?: string
  fetchImpl?: FetchLike
}

export class OpenAiEvidenceDrafter {
  readonly #apiKey: string
  readonly #model: string
  readonly #endpoint: string
  readonly #fetch: FetchLike

  constructor(options: OpenAiEvidenceDrafterOptions) {
    if (options.apiKey.trim().length === 0) {
      throw new Error('OPENAI_API_KEY is required')
    }
    this.#apiKey = options.apiKey
    this.#model = options.model ?? defaultOpenAiModel
    this.#endpoint = options.endpoint ?? 'https://api.openai.com/v1/responses'
    this.#fetch = options.fetchImpl ?? fetch
  }

  async draft(unparsedInput: EvidenceDraftInput): Promise<{
    responseId: string
    model: string
    draft: EvidenceDraft
  }> {
    const input = EvidenceDraftInputSchema.parse(unparsedInput)
    const response = await this.#fetch(this.#endpoint, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.#apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.#model,
        store: false,
        reasoning: { effort: 'low' },
        max_output_tokens: 4_000,
        instructions: evidenceDraftInstructions,
        input: JSON.stringify(input),
        text: {
          verbosity: 'low',
          format: {
            type: 'json_schema',
            name: 'glyph_evidence_draft',
            strict: true,
            schema: z.toJSONSchema(EvidenceDraftSchema),
          },
        },
      }),
    })

    if (!response.ok) {
      const requestId = response.headers.get('x-request-id')
      throw new Error(
        `OpenAI Responses request failed with status ${response.status}${requestId === null ? '' : ` (request ${requestId})`}`,
      )
    }

    const envelope = ResponseEnvelopeSchema.parse(await response.json())
    const content = envelope.output.flatMap((item) => item.content ?? [])
    const refusal = content.find((item) => item.type === 'refusal')?.refusal
    if (refusal !== undefined) {
      throw new Error(`OpenAI response was refused: ${refusal}`)
    }
    const outputText = content.find((item) => item.type === 'output_text')?.text
    if (outputText === undefined) {
      throw new Error('OpenAI response did not contain structured output text')
    }

    const draft = EvidenceDraftSchema.parse(JSON.parse(outputText))
    validateEvidenceReferences(
      draft,
      new Set(input.evidence.map((item) => item.id)),
    )
    return { responseId: envelope.id, model: envelope.model, draft }
  }
}

export const evidenceDraftInstructions = `You draft a concise investor-facing paper brief from pre-selected evidence spans.

Use only the supplied evidence. Every supported claim must cite one or more supplied evidence IDs. Never invent an evidence ID. If the supplied evidence does not support a material conclusion, return that conclusion with INSUFFICIENT_EVIDENCE and an empty evidenceSpanIds array. Preserve material caveats in each claim's limitation. Distinguish what the paper represents from market or margin conclusions it does not establish.`

function validateEvidenceReferences(
  draft: EvidenceDraft,
  knownEvidenceIds: ReadonlySet<string>,
): void {
  for (const claim of draft.claims) {
    for (const evidenceId of claim.evidenceSpanIds) {
      if (!knownEvidenceIds.has(evidenceId)) {
        throw new Error(`Draft references unknown evidence span ${evidenceId}`)
      }
    }
  }
}

export * from './runtime-agents.js'
