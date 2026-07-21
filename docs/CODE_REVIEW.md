# Glyph Code Review Guide

## Review contract

Review against the current task, the nearest `AGENTS.md`, the V1 PRD, and the
architecture boundaries. Prioritize correctness and user harm over style.

Unless the user asks for fixes, review is read-only. Return actionable findings
ordered by severity with tight file and line references. Explain the concrete
failure mode and the smallest appropriate correction. Avoid speculative findings
that cannot occur in the changed behavior.

Severity levels:

- **P0 — Critical:** publication, security, privacy, billing, or irreversible
  data failure requiring immediate stop.
- **P1 — High:** incorrect evidence or factual output, authorization bypass,
  broken core flow, or likely production failure.
- **P2 — Medium:** meaningful edge-case, accessibility, responsive, resilience,
  maintainability, or coverage gap.
- **P3 — Low:** localized quality issue worth addressing but unlikely to alter
  behavior materially.

## Review priorities

### Evidence and semantic integrity

- Material claims point to valid evidence from the correct paper version.
- PDF page, section, passage, and normalized coordinates are real and remain
  aligned through rendering and version changes.
- Paper facts, author claims, Glyph calculations, interpretations, and investment
  hypotheses cannot be confused in storage, APIs, or presentation.
- Unsupported, contradictory, malformed, or stale evidence fails explicitly as
  `INSUFFICIENT_EVIDENCE` where appropriate.
- No fallback turns missing data into apparently successful content.
- Benchmark conditions, model versions, units, dates, and denominators are
  preserved and comparable.
- Complexity claims identify training, prefill, per-token decoding, or cumulative
  generation.

### AI and structured data

- External and model-generated data is validated at the boundary.
- Structured-output, prompt, and schema versions remain reproducible.
- Unknown fields and evidence identifiers are rejected or deliberately handled.
- Extraction, synthesis, critique, and approval do not collapse into one
  unreviewable step.
- Prompt or schema changes include representative eval coverage and do not
  weaken unrelated cases.
- Generated images do not determine factual diagram labels, relationships,
  arrows, units, or topology.

### Publication, access, and external effects

- Automated workflows cannot bypass human editorial approval.
- Publication fails closed when a blocking integrity rule fails.
- Authentication and authorization are enforced at server and persistence
  boundaries.
- Paid archive, user-owned records, and restricted source material cannot leak
  through routes, caches, logs, previews, or exports.
- Billing, email, social distribution, and job retries are idempotent.
- External actions require explicit intent and surface partial failures.

### Architecture and resilience

- Domain code remains framework- and provider-independent.
- Client UI does not call provider SDKs directly.
- Page components do not contain report-generation or publication logic.
- Provider adapters remain behind application ports.
- Background jobs are retry-safe and do not duplicate external effects.
- Errors are observable and actionable rather than swallowed.
- Secrets and sensitive content do not appear in code, fixtures, logs, or diffs.

### Product and UI behavior

- The five-minute layer communicates the paper's central claim to the primary
  user without materially changing it.
- Technical depth expands without losing reading or evidence position.
- Desktop evidence navigation preserves report position; mobile opens the exact
  evidence passage on demand.
- Difficult terms have contextual concept cards where required.
- Market and company implications appear only when relevant and defensible.
- The newsletter follows the exact five-bullet contract.
- UI changes follow the canonical reference direction in the PRD: editorial
  hierarchy, restrained violet-blue accents, generous whitespace, subtle
  borders, compact diagrams, and low-noise interaction.
- Layouts work at desktop, tablet, and mobile widths without illegible text,
  clipped controls, or hidden evidence.
- Keyboard navigation, focus visibility, semantic structure, labels, contrast,
  and reduced motion are covered.

### Tests and verification

- Tests cover the new behavior and its meaningful failure modes.
- Evidence work includes missing, contradictory, malformed, and wrong-version
  cases.
- UI work exercises the real interaction, not only isolated rendering.
- Migrations and job changes include retry, rollback, and partial-failure
  coverage where applicable.
- Verification commands match repository scripts and their results are reported
  honestly.
- The diff contains no unrelated edits, duplicated primitives, or hard-coded
  factual fixtures in production paths.

## Review output

Return:

1. Findings ordered from P0 to P3, each with a file reference and concrete
   impact.
2. Open questions only when the answer could materially change correctness.
3. A short residual-risk and verification summary.

If there are no actionable findings, say so directly and still state any checks
or user flows that were not verified.
