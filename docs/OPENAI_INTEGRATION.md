# OpenAI integration boundary

Glyph now has one shared GPT-5.6 structured-output transport for eight runtime
agents plus the original evidence-drafting adapter. The runtime system remains
bounded by deterministic source, ontology, evidence, integrity, and publication
controls; it does not grant the model source access or publication authority.

## Model and endpoint

- Responses API: `POST /v1/responses`
- Default model: `gpt-5.6-terra`
- Explicit reasoning effort: `low`
- Structured output: strict JSON Schema through `text.format`
- Storage: disabled with `store: false`

Terra is used as a balanced drafting tier. The boundary keeps the model configurable through `OPENAI_MODEL`; changing the model is an evaluated product decision, not a global string replacement.

## Runtime agents

The classifier, ranker, evidence extractor, summarizer, concept mapper, market
analyst, integrity reviewer, and editorial packager use separate versioned
prompts and Zod-derived strict JSON Schemas. Their complete responsibilities and
workflow are documented in [`RUNTIME_AGENTS.md`](RUNTIME_AGENTS.md).

All paper and market content is marked as untrusted input. The common transport
sets `store: false`, low reasoning effort, low output verbosity, bounded output
tokens, explicit timeout handling, and at most three attempts for retryable
provider failures.

## Evidence-draft input

- canonical paper title;
- one investor question;
- pre-selected evidence IDs, page numbers, and exact text.

## Evidence-draft output and validation

The model returns an executive summary, up to eight claims, their support status and evidence IDs, limitations, and open questions. Runtime validation rejects:

- malformed structured output;
- supported claims without evidence IDs;
- insufficient-evidence claims that still cite support;
- evidence IDs absent from the supplied input;
- refusals and HTTP failures.

No live API call is required for the test suite. Tests use a local mock transport and inspect the actual request contract. A live credential must never be committed; set `OPENAI_API_KEY` only in the runtime environment.

## Final paper gate

When the gold paper arrives, a human must select and verify the evidence spans before running the drafter. A second human review must compare every generated claim with the source before the content can pass the existing publication gates.

Implementation: `packages/openai/src/index.ts` and
`packages/openai/src/runtime-agents.ts`.

Official references used for the contract:

- https://developers.openai.com/api/docs/guides/structured-outputs
- https://developers.openai.com/api/docs/guides/model-guidance?model=gpt-5.6-sol#prompting-best-practices
