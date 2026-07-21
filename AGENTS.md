# Glyph Repository Instructions

## Scope and sources of truth

These instructions apply to the whole repository until a more specific nested
`AGENTS.md` exists.

- Follow the user's current task first. If it conflicts materially with a
  durable repository rule, surface the conflict before changing behavior.
- Treat [the V1 PRD](docs/PRD.md) as the product source of truth.
- Treat [the architecture document](docs/ARCHITECTURE.md) as the technical
  boundary source of truth.
- Use [the task template](docs/TASK_TEMPLATE.md) for meaningful implementation
  work and [the review guide](docs/CODE_REVIEW.md) for reviews.
- Keep durable rules here. Put feature requirements in the PRD, technical
  decisions in architecture records, and one-off constraints in the task.

## Working policy

- Inspect relevant files and existing patterns before editing.
- Keep changes scoped to the requested outcome and preserve unrelated user
  work.
- Prefer the smallest complete change. Do not add speculative abstractions,
  dependencies, vendors, fallbacks, or features.
- Use a written plan before cross-module work or changes involving data models,
  migrations, AI prompts or schemas, PDF evidence mapping, analytical diagrams,
  authentication, billing, publication, security, or provider selection.
- Small, isolated, well-specified edits may proceed without a formal plan.
- Do not commit, push, open pull requests, publish content, send messages, or
  mutate external systems unless the user explicitly requests that action.
- Never commit credentials, tokens, private source documents, or user data.

## Product invariants

- Understanding the technical mechanism precedes investment interpretation.
- Use progressive depth: simple explanation first, technical detail on demand.
- Every material claim must reference valid supporting evidence.
- Keep `PAPER_FACT`, `AUTHOR_CLAIM`, `GLYPH_CALCULATION`,
  `GLYPH_INTERPRETATION`, and `INVESTMENT_HYPOTHESIS` distinct.
- Missing support must return `INSUFFICIENT_EVIDENCE`; never fill a gap with a
  plausible or success-shaped fallback.
- Never invent citations, passages, PDF pages or coordinates, benchmark
  conditions, model versions, dates, numerical units, or denominators.
- Preserve the distinction between demonstrated results and possible future
  effects.
- "No direct trade implication" is a valid conclusion. Never force a company,
  sector, recommendation, or price-target connection.
- Human editorial approval is required before publication or distribution.
- Restricted or paywalled material remains an external link; do not scrape it.

## Evidence, AI, and market data

- Validate external and model-generated data at system boundaries with
  versioned structured schemas.
- Reject unknown or mismatched evidence identifiers explicitly.
- Preserve paper version, source location, retrieval time, model identifier,
  prompt version, and schema version wherever they affect reproducibility.
- Keep extraction, synthesis, critique, and publication approval as distinct
  workflow stages.
- Complexity claims must identify whether they concern training, prefill,
  per-token decoding, or cumulative generation.
- Market metrics require a source, retrieval date, model or product version,
  value, unit, relevant operating conditions, and comparison limitations.
- Do not compare metrics with mismatched versions, periods, conditions, or
  denominators.
- When an AI prompt, schema, retrieval policy, or grader changes, add or update
  representative eval cases before declaring the change complete.

## Architecture boundaries

- The planned repository is a pnpm TypeScript monorepo. Do not scaffold it until
  the user requests implementation.
- Domain code is framework-independent and must not import application or
  infrastructure packages.
- UI components must not call OpenAI, storage, billing, email, or job-provider
  SDKs directly.
- Report-generation and publication logic must not live in Next.js page
  components.
- Background jobs must be idempotent, retry-safe, and explicit about failure.
- Provider-specific code belongs behind application ports and adapters.
- OpenAI Responses API and Stripe are approved V1 capabilities. Database,
  vector search, storage, authentication, email, hosting, and job vendors remain
  undecided until recorded in an architecture decision.

## UI and visual rules

- Preserve the split-screen reader as the core product experience: paper and
  evidence on the left, progressive report on the right; mobile presents the
  report first and opens evidence on demand.
- Follow the visual direction recorded in the PRD: light editorial surfaces,
  serif display headings, legible sans-serif supporting text, pale violet-blue
  accents, restrained borders and shadows, generous whitespace, and calm,
  information-first interaction.
- Evidence must be reachable without losing report position.
- Technical detail is collapsed by default but remains available in context.
- Analytical diagrams originate from a `VisualSpec` containing exact labels,
  relationships, units, claims, and citations, and are rendered
  deterministically as SVG.
- Generated images may provide non-semantic illustration or styling only. They
  must not determine factual labels, arrows, topology, or numerical relations.
- Verify responsive behavior, keyboard access, focus, contrast, readable type,
  and reduced-motion behavior for relevant UI changes.

## Verification and completion

- Run the smallest relevant checks while working and all checks affected by the
  final change.
- At milestones, run the repository's full lint, type-check, test, build,
  browser-test, and eval commands once those scripts exist.
- Exercise user-visible behavior, not only unit-level behavior.
- Review the final diff for regressions, duplicate logic, hard-coded factual
  content, unrelated edits, and missing tests.
- Repair discovered issues before finishing when they are in scope.
- Never claim a check passed if it was not run. Report exactly what was
  verified, what could not be verified, and why.
