# Glyph

Glyph is a source-linked research product for investors and finance-native readers who need to understand an important AI paper quickly without losing the evidence behind the analysis. The product turns a selected paper into a concise editorial brief, concept explanations, market implications, and claim-level links back to the exact source pages.

This repository contains the local V1 and its worked Kimi K3 example. The demo is deterministic and does not require credentials or make live provider calls by default.

## Use Glyph

Requirements:

- Node.js 22 or newer
- pnpm 11.9.0

Start the product:

```bash
pnpm install
pnpm dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000), choose **Enter Glyph**, and continue through the local demo login. No credentials are sent to an identity provider.

The primary product journey is:

1. **Landing (`/`)** — understand the product promise and enter the demo.
2. **Home (`/home`)** — scan today's selected research and its significance.
3. **Categories (`/layers/[slug]`)** — browse Models, Agents, Chips & Systems, Data, and Safety & Alignment. Categories without approved papers show honest empty states.
4. **Evidence reader (`/reader/kimi-k3`)** — read the report beside the source document. Selecting a cited claim opens the matching page and highlight. Report tabs separate the executive summary, technical concepts, causal evidence, and economics.
5. **Full report (`/reports/kimi-k3`)** — inspect the longer investment-oriented analysis and source register.
6. **Library and editor (`/library`, `/editor`)** — review saved concepts and the deterministic editorial pipeline. Editor actions are protected by the server-validated demo role.

The canonical shared workspace for project agents is `/Users/eceozdag/Documents/Glyph`. Product changes developed in another clone or worktree are not considered handed off until they have been reconciled into this repository and verified here.

## Product components

Glyph is a pnpm monorepo with explicit boundaries between product UI, domain logic, workflow coordination, and providers.

| Component       | Location                                 | Responsibility                                                                                                                                 |
| --------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Web product     | `apps/web`                               | Next.js App Router UI, landing, demo access, research home, categories, split evidence reader, reports, library, editor, and previews          |
| Research worker | `apps/worker`                            | Idempotent local pipeline stages: discover, classify, rank, select, parse, extract evidence, generate outline/report/visuals, and automated QA |
| Domain          | `packages/domain`                        | Versioned schemas for papers, reports, claims, evidence spans, concepts, visuals, generations, and pipeline runs                               |
| Application     | `packages/application`                   | Use cases and provider-neutral ports for repositories, AI generation, assets, auth, subscriptions, distribution, and jobs                      |
| AI adapters     | `packages/ai`                            | Deterministic demo gateway plus opt-in OpenAI Responses API and GPT Image adapters with strict structured outputs                              |
| Persistence     | `packages/database`                      | Provider-neutral PostgreSQL/Drizzle schema and adapters; the running demo uses in-memory repositories                                          |
| Diagrams        | `packages/diagrams`                      | Deterministic analytical visuals that remain inspectable and reproducible                                                                      |
| Shared UI       | `packages/ui`                            | Reusable presentation primitives                                                                                                               |
| Kimi K3 fixture | `fixtures/kimi-k3` and `apps/web/public` | The worked paper, report, exact evidence mapping, and deterministic page renders used by the product                                           |

The source/evidence boundary is intentional: an evidence span belongs to one immutable paper version, invalid mappings fail closed, and generated analytical claims remain distinguishable from source facts and author claims.

## API and provider connections

All external actions are disabled by default. Copy `.env.example` only when developing an explicitly approved integration.

| Connection                     | Used by                                                               | Product purpose                                                                                             | Local V1 status                                                                                                             |
| ------------------------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| OpenAI Responses API           | `OpenAiResponsesGateway` in `packages/ai`                             | Structured classification, evidence extraction, report synthesis, report critique, and evidence-bounded Q&A | Implemented behind `GLYPH_ENABLE_LIVE_AI`; the demo uses `DeterministicAiGateway`                                           |
| OpenAI Image API / GPT Image 2 | `OpenAiImageGateway`, called by the editor illustration-draft service | Optional non-semantic editorial illustrations only; never evidence, charts, labels, or analytical diagrams  | Implemented behind both editor authorization and `GLYPH_ENABLE_LIVE_IMAGE_GENERATION`; every result is pending human review |
| Stripe API                     | `StripeSubscriptionGateway` in the web server provider layer          | Future subscription checkout and access status                                                              | Adapter shell only; `GLYPH_ENABLE_LIVE_BILLING` is off and checkout creation fails closed                                   |
| PostgreSQL                     | `packages/database`                                                   | Future durable papers, reports, evidence, generations, and pipeline records                                 | Schema/adapters exist; no managed provider is selected and the demo remains in memory                                       |
| Authentication                 | `DemoAuthGateway` and server actions                                  | Visitor, subscriber-demo, and editor-demo roles                                                             | Local cookie-based demo only; no production identity provider is connected                                                  |
| Email and social distribution  | `PreviewOnlyDistributionGateway`                                      | Newsletter and social-post previews after editorial approval                                                | Preview only; sending and publishing are disabled                                                                           |
| Paper/PDF assets               | local fixture store and `apps/web/public`                             | Exact source pages, report HTML, and reader highlights                                                      | Local deterministic assets; no external storage provider is connected                                                       |
| Background jobs                | `LocalJobRunner` in `apps/worker`                                     | Retryable, idempotent research-pipeline execution                                                           | Local deterministic runner; no queue or scheduler provider is connected                                                     |

The runtime AI task names map directly to product responsibilities:

- `classify` — paper triage and topic labeling.
- `extract-evidence` — creates evidence references tied to the selected paper version.
- `synthesize-report` — produces a schema-validated report draft.
- `critique-report` — identifies editorial or evidence blockers before approval.
- `answer-question` — answers only from supplied evidence spans and returns `INSUFFICIENT_EVIDENCE` when support is missing.

Live AI requires `GLYPH_ENABLE_LIVE_AI=true`, `OPENAI_API_KEY`, and an explicit `OPENAI_MODEL`. Live illustration drafts additionally require `GLYPH_ENABLE_LIVE_IMAGE_GENERATION=true`; `OPENAI_MODEL_ILLUSTRATION` defaults to `gpt-image-2`. Provider clients are initialized lazily on the server, and presentation components cannot call them directly.

## How Codex and GPT-5.6 were used

Codex was used as the development environment and coordination layer for the repository. Separate planning and backend-engineering workstreams translated the PRD into the product journey, monorepo boundaries, implementation, evidence-reader behavior, and acceptance checks. GPT-5.6 supported that engineering work by drafting and reviewing code, tracing product requirements into tests, diagnosing reader and PDF-rendering failures, and running the repository verification loop.

Codex/GPT-5.6 are development tools here, not an invisible runtime dependency. The checked-in Kimi K3 experience is deterministic, source-linked, and reviewable without an API key. Any future model-generated output must pass the same versioned schemas, evidence constraints, automated QA, and human editorial approval boundary.

## Verification

Run the full contract:

```bash
pnpm setup:browsers # once per development machine
pnpm verify
```

`pnpm verify` checks formatting, lint, TypeScript, unit tests, integration tests, evidence-integrity evals, architecture boundaries, the production build, and desktop/mobile Playwright flows.

See [`PLAN.md`](PLAN.md) for the build plan, [`docs/PRD.md`](docs/PRD.md) for product requirements, [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for system boundaries, and [`docs/HANDOFF_TODOS.md`](docs/HANDOFF_TODOS.md) for remaining production decisions.
