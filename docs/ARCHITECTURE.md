# Glyph V1 Architecture

Status: implemented fixture-driven V1 foundation.

## Purpose

Glyph is a pnpm TypeScript monorepo that separates the public learning
experience, asynchronous paper-processing workflow, core research concepts,
provider integrations, and deterministic visual generation. This document
defines the durable package boundaries and capability ownership. Provider
selection remains deferred where the PRD does not prescribe a vendor.

## Repository shape

The fixture-driven V1 implements the following paths:

```text
apps/
  web/            Next.js product, editor, API, and server entry points
  worker/         Discovery, parsing, generation, QA, and distribution jobs
packages/
  domain/         Framework-independent entities, value objects, and invariants
  application/    Use cases, workflow coordination, and provider ports
  ai/             OpenAI adapters, prompts, structured outputs, and eval support
  database/       Provider-neutral PostgreSQL schema, migration, and repository adapter
  diagrams/       VisualSpec validation and deterministic SVG rendering
  ui/             Shared accessible UI primitives and design tokens
  config/         Shared TypeScript, lint, and test configuration
evals/            Versioned fixtures, graders, and expected behavior
scripts/          Architecture and integrity verification commands
```

Package boundaries may only be changed through an explicit architecture
decision. Nested `AGENTS.md` files remain planned for a later phase when a
package needs instructions beyond the root rules.

## Dependency direction

```text
apps/web ────────> application ────────> domain
    │                    ▲
    └────────────> ui    │
                         │
apps/worker ─────────────┤
    │                    │
    ├────────────> ai ───┤
    ├───────> database ──┤
    └────────> diagrams ─┘
```

- `domain` imports no application, framework, or provider package.
- `application` imports `domain` and defines use cases and provider-facing
  ports. It does not import concrete provider SDKs.
- `ai`, `database`, and other infrastructure packages implement application
  ports. They do not import either application entry point.
- `ui` contains presentation primitives and has no AI, persistence, billing,
  email, or background-job knowledge.
- `web` invokes application use cases from server boundaries. Client components
  never invoke provider SDKs directly.
- `worker` composes use cases with infrastructure adapters and owns asynchronous
  execution, retries, and operational status.
- `diagrams` validates structured visual specifications and renders semantic
  diagrams without using image generation to decide factual content.

The root architecture verifier enforces these import boundaries and rejects
direct provider imports from presentation code.

## System responsibilities

### Web application

- Public featured report, archive, inbox, split-screen reader, concepts, saved
  library, cited Q&A, account, billing, and editorial surfaces.
- Server-side application entry points for authenticated commands and queries.
- PDF.js-compatible rendering with page-level highlights and normalized evidence
  coordinates.
- Responsive presentation that keeps report context while opening evidence.

### Background worker

- Discovery, metadata normalization, version deduplication, ranking, parsing,
  evidence extraction, teaching-outline generation, report synthesis, visual
  preparation, automated QA, and approved distribution.
- Idempotency keys for every externally observable stage.
- Retry-safe stages with explicit terminal errors; no success-shaped fallback.
- A hard editorial gate between automated QA and publication.

### Domain and application

- Own the vocabulary and invariants for papers, versions, evidence, claims,
  reports, concepts, visuals, market metrics, profiles, saved concepts, and cited
  answers.
- Keep claim type and evidence linkage explicit through every transformation.
- Model publication eligibility as a rule, not a UI convention.
- Keep provider selection and transport details outside domain code.

### AI integration

- Use OpenAI's Responses API with versioned structured outputs for extraction,
  definitions, report specifications, critique, and cited Q&A.
- Use OpenAI's Image API for one-off GPT Image 2 illustration drafts. Image
  generation is a separate, opt-in server capability and does not share the
  publication approval boundary.
- Route classification, deep synthesis, and visual illustration through
  configurable model roles rather than hard-coded model identifiers in domain
  logic.
- Record model, prompt, schema, generation time, and source-paper version for
  reproducibility.
- Separate extraction, synthesis, and critique prompts and eval them against
  representative normal, insufficient, contradictory, and malformed cases.
- GPT Image 2 may create non-semantic illustration. It cannot decide analytical
  labels, arrows, topology, units, or numerical relationships.
- Every generated illustration starts as `PENDING_HUMAN_REVIEW` with semantic
  use prohibited. It cannot be attached to a publishable revision until an
  editor reviews the exact generated asset.

### Persistence and files

- Use the provider-neutral PostgreSQL-compatible schema and application ports as
  the V1 boundary. The managed PostgreSQL/vector and object-storage vendors are
  deliberately unselected.
- The local demo uses a deterministic fixture asset store for its synthetic PDF;
  production files must use the future object-storage adapter.
- Store canonical URL, paper version, checksum, licence status, publication and
  revision dates, page text, sections, figures, tables, passage locations, and
  citation relationships where permitted.
- Keep restricted material external and store only allowed metadata and links.
- Enforce user ownership and editorial permissions at the persistence boundary,
  not only in UI code.

## Evidence and coordinate contract

- An `EvidenceSpan` belongs to a specific `PaperVersion` and identifies its page,
  extracted text, source section, and normalized page-relative bounding boxes.
- Coordinates must be independent of zoom level and viewport dimensions.
- Every claim-to-evidence reference is validated before a report can advance.
- Missing, stale, or mismatched page mappings are explicit failures.
- A claim may use multiple evidence spans and an evidence span may support
  multiple claims.
- The report stays in place while evidence navigation moves the PDF on desktop;
  mobile opens the evidence passage on demand.

These are behavioral contracts, not final database or TypeScript schemas.

## Publication boundary

The processing state progresses through:

```text
discover -> classify -> rank -> select -> parse -> extract evidence
-> generate teaching outline -> generate report -> generate visuals
-> automated QA -> editor approval -> publish -> distribute
```

No component may skip editor approval. Publication must fail closed when a
material claim lacks evidence, source mapping fails, a contextual definition is
misleading, a diagram contradicts its sources, a market metric lacks required
context, or semantic claim types cannot be distinguished.

## Provider decisions

Approved by the PRD:

- OpenAI Responses API and structured outputs.
- GPT Image 2 for non-semantic visual work.
- Stripe for subscriptions.

Deferred until dedicated decisions:

- PostgreSQL and vector-search provider.
- Object-storage provider.
- Authentication provider.
- Transactional-email provider.
- Hosting and deployment platform.
- Background-job and scheduling provider.
- Analytics and observability providers.

Provider-specific code must remain replaceable behind application ports. A
provider decision must document security, privacy, data residency, failure
behavior, cost, local development, and migration implications.

## Quality strategy

- Unit tests protect domain invariants, normalization, ranking, claim typing,
  evidence validation, and visual specifications.
- Integration tests protect database adapters, object storage, OpenAI structured
  output handling, billing webhooks, email, and job idempotency.
- Evals protect extraction, evidence linking, concepts, report sections,
  diagrams, trade implications, newsletter output, and cited Q&A.
- Browser tests protect the public report, split-reader navigation, responsive
  evidence flow, editorial approval, subscription access, and saved concepts.
- Structural checks enforce dependency direction and reject direct provider
  calls from presentation code.
