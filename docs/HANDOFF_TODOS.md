# Glyph Local V1 Handoff TODOs

Status: **local V1 ready for review**

Cloud and the overnight protocol are no longer part of the requested workflow.
The application was built and verified directly in this workspace. Nothing has
been committed, pushed, deployed, published, emailed, posted, or charged.

## Verified locally

- `pnpm install --frozen-lockfile` passes without lockfile changes.
- Formatting, lint, strict TypeScript, and architecture checks pass.
- 58 unit tests, 4 worker integration tests, and 16 integrity evals pass.
- The deterministic fixture regenerates consistently.
- The Next.js 16 production build succeeds for all application routes.
- Core inbox, report, evidence-reader, concept, role, editor, and preview flows
  were exercised in the in-app browser.
- The editor-only illustration endpoint was exercised with live generation
  disabled and failed closed with `LIVE_IMAGE_GENERATION_DISABLED`; no provider
  request was made.
- Live AI, billing, email, social, publication, and deployment remain disabled.

## GPT Image 2 draft integration

- The server-only adapter uses OpenAI's Image API with the configurable
  `OPENAI_MODEL_ILLUSTRATION` role, defaulting to `gpt-image-2`.
- The local endpoint is `/api/editor/illustration-drafts`. It requires the
  editor role, an explicit non-semantic-use confirmation, and both
  `GLYPH_ENABLE_LIVE_AI=true` and
  `GLYPH_ENABLE_LIVE_IMAGE_GENERATION=true`.
- Prompts prohibit text, labels, numbers, arrows, charts, diagrams, citations,
  factual claims, evidence, and investment implications.
- Every output is an image/png draft marked `PENDING_HUMAN_REVIEW` and
  `semanticUseAllowed: false`.
- No image request has been sent and no API credits have been used. A paid live
  smoke test remains blocked until the user explicitly authorizes that exact
  call.

## Start the local application

```bash
pnpm dev
```

Open `http://127.0.0.1:3000` and review these primary routes:

- `/`
- `/reports/agent-swarm-demo`
- `/reader/agent-swarm-demo`
- `/library`
- `/editor`
- `/previews/newsletter`
- `/previews/x`

The production build is currently running at `http://127.0.0.1:3000`. A final
browser pass loaded all eight primary/error routes with meaningful content, no
framework error overlay, no horizontal overflow, and the requested page-2
evidence highlight.

## P0 — complete before the first commit

- [ ] Run `pnpm setup:browsers` and `pnpm test:e2e` from a normal Terminal or
      another browser-capable local environment. The managed Codex sandbox
      denies Chromium's macOS Mach-port registration before the first page;
      this is not an application assertion failure.
- [ ] Review the Playwright desktop and mobile results, including Axe, keyboard
      navigation, focus restoration, exact evidence pages, zoom invariance,
      permission states, and PDF failure behavior.
- [ ] Compare the application with both images in `docs/references/`, checking
      hierarchy, spacing, typography, violet accents, diagram legibility, and
      mobile evidence presentation.
- [ ] Review every untracked file and follow `docs/CODE_REVIEW.md`. This
      repository still has no initial commit.
- [ ] Resolve every P0/P1 review finding before authorizing a commit or push.

## P1 — product and infrastructure decisions

- [ ] Select managed PostgreSQL and vector-search services.
- [ ] Select permitted PDF/object storage and define the licensing policy.
- [ ] Select invite-only production authentication.
- [ ] Select background-job execution and observability.
- [ ] Select transactional email and hosting.
- [ ] Decide whether Stripe test mode is required for the next milestone.
- [ ] Approve model roles, prompts, schemas, and data policy before enabling the
      OpenAI Responses API.
- [ ] Review and approve the non-semantic illustration prompt before enabling
      the local GPT Image 2 endpoint.
- [ ] Run one explicitly authorized low-quality GPT Image 2 smoke test, inspect
      the returned draft, and record the human decision. Do not reuse the draft
      as an analytical diagram.
- [ ] Supply one canonical public paper and complete source, licence, extraction,
      evidence-mapping, and editorial review before replacing synthetic data.

## Release integrity checklist

- [ ] Every material claim has valid evidence from the same paper version.
- [ ] Facts, author claims, Glyph calculations, interpretations, and investment
      hypotheses remain visibly distinct.
- [ ] Unsupported output remains `INSUFFICIENT_EVIDENCE` with no plausible
      fallback.
- [ ] Market metrics include source, retrieval date, version, unit, denominator,
      conditions, relevance, and comparison limitations.
- [ ] Analytical diagrams remain deterministic SVG generated from validated
      `VisualSpec` records.
- [ ] A real editor approves the exact revision before publication or
      distribution.
- [ ] “No direct trade implication” remains an acceptable final conclusion.
- [ ] External side effects stay disabled until staging authorization and
      publication gates are tested.

## Definition of the next handoff

The next milestone is ready only when the browser suite passes, human visual
review is recorded, provider decisions are documented as architecture decisions,
and the user explicitly authorizes the first commit or any external action.
