# Glyph Overnight V1 Build Plan

Status: ready for an autonomous `/goal` run.

## Objective

By the morning handoff, Glyph must be a polished, runnable, production-shaped
local beta that demonstrates the complete core learning loop from the V1 PRD:

```text
inbox -> report landing -> progressive report -> exact evidence navigation
-> contextual concept learning -> saved library -> editorial approval preview
-> newsletter and X preview
```

The build must use one fully validated synthetic paper edition, clearly labelled
as demo data. It must exercise real domain rules, a real generated PDF fixture,
normalized evidence coordinates, deterministic factual SVG diagrams,
OpenAI-generated non-semantic illustration where credentials and policy allow,
responsive UI, tests, eval-style integrity cases, and safe provider boundaries.

The stopping condition is not “the pages exist.” The goal is complete only when
the full local flow works, `pnpm verify` passes, browser tests pass at desktop
and mobile sizes, screenshots and a handoff report exist, and the final diff has
been reviewed against `AGENTS.md`, the PRD, the architecture document, and the
code-review guide.

## What “V1 overnight” means

This run builds the software shape and complete local experience of V1. It does
not perform launch operations or silently make pending vendor decisions.

### Required by morning

- A pnpm TypeScript monorepo matching `docs/ARCHITECTURE.md`.
- A Next.js App Router application with the core public, subscriber-demo, and
  editor-demo surfaces.
- Framework-independent domain contracts and validation for all PRD core
  records.
- A deterministic synthetic paper PDF and edition fixture with real test
  coordinates generated from the same source.
- Exact claim-to-evidence navigation on desktop and mobile.
- Progressive report depth, contextual concept cards, deterministic diagrams,
  saved-library behavior, cited Q&A states, and distribution previews.
- A simulated discovery-to-approval worker workflow with explicit failures and
  idempotency tests.
- Provider ports plus build-safe adapter shells for PostgreSQL, object storage,
  OpenAI Responses API, Stripe, authentication, email, and job execution.
- Loading, empty, error, permission, blocked-publication, and
  `INSUFFICIENT_EVIDENCE` states.
- Unit, integration, browser, accessibility, architecture, and integrity
  verification runnable from root scripts.
- `docs/OVERNIGHT_HANDOFF.md` and review screenshots under
  `work/overnight/screenshots/`.

### Explicitly not performed overnight

- No real subscription charges, emails, X posts, publication, or deployment.
- No live model calls or generated factual paper analysis.
- No scraping or downloading paywalled or restricted content.
- No claim that the synthetic edition is a real paper or a publishable report.
- No selection of a managed PostgreSQL, vector, storage, authentication, email,
  hosting, or job vendor.
- No attempt to populate the launch targets of 50–100 labelled papers, 25
  reports, or 50 invited users.
- No commit, push, pull request, or GitHub mutation.

Those items require credentials, vendor approval, source-paper review, or human
editorial action and belong in the morning decisions.

## Sources and precedence

Read these before editing:

1. `AGENTS.md` — durable repository and product invariants.
2. `docs/PRD.md` — product source of truth and UI references.
3. `docs/ARCHITECTURE.md` — package and provider boundaries.
4. `docs/CODE_REVIEW.md` — final review contract.
5. This plan — overnight scope, ordering, interfaces, and stopping condition.

If the plan conflicts with a product or evidence invariant, the invariant wins.
Do not weaken the PRD, instructions, tests, or graders to make the build appear
complete. Record any genuine conflict in the handoff instead.

## Autonomy and safety contract

- Preserve the existing documentation and reference images.
- Use network access only for installing public package dependencies. Do not
  fetch a real research paper or make a live provider request.
- Use mock or in-memory adapters by default. Provider SDK clients must be
  initialized lazily inside server-only getters so `next build` never requires
  runtime secrets.
- Never place secrets or invented placeholder secrets in source. Add documented
  empty variables to `.env.example` only.
- Keep all external-action adapters disabled unless an explicit runtime flag is
  true. Tests must prove the default configuration cannot send, charge, publish,
  or call a model.
- When an optional capability cannot run without credentials, finish and test
  its port, adapter contract, mocked implementation, and UI state; record the
  missing live verification in the handoff.
- Do not replace missing evidence with plausible text or coordinates. Synthetic
  evidence is allowed only inside clearly marked test/demo fixtures.
- Work milestone by milestone. After each milestone, run its focused checks and
  repair failures before continuing.
- Keep `docs/OVERNIGHT_HANDOFF.md` current with milestone status, verification,
  screenshots, deviations, and remaining decisions.
- Never commit, push, deploy, publish, or mutate an external service.

## Technical baseline

### Runtime and workspace

- Use Node.js 22 and pnpm 11, matching the available environment. Record the
  exact pnpm version in the root `packageManager` field and add an `.nvmrc` for
  Node 22.
- Use pnpm workspaces without Turborepo. Root scripts should orchestrate package
  scripts with `pnpm --recursive` or explicit filters.
- Use TypeScript strict mode across every package. Avoid `any`; validate unknown
  data before narrowing.
- Add one root lockfile, shared lint/type/test configuration, `.gitignore`,
  `.editorconfig`, `.env.example`, and a concise `README.md` with local commands.
- Use stable package releases only, never canary versions. Use a stable Next.js
  16 App Router release and React 19.2.4 or newer.

### Next.js application

- Use the App Router under `apps/web/src/app`.
- Server Components are the default. Push client components down to the
  smallest interactive boundary.
- Use Server Actions for in-app demo mutations and Route Handlers only for
  public API-style boundaries, webhooks, or file responses.
- Await `params`, `searchParams`, `cookies()`, and `headers()` as required by
  Next.js 16.
- Do not use `proxy.ts` as an authorization boundary. Re-check roles in server
  entry points and repository methods.
- Initialize database, OpenAI, Stripe, email, storage, and job clients lazily;
  never at module scope.
- Use Tailwind CSS v4 and a small set of accessible shadcn/ui primitives for
  sheets, dialogs, tabs, tooltips, and controls. Theme them to Glyph rather than
  retaining default styling.
- Use literal CSS font stacks to avoid build-time font downloads: an editorial
  serif stack for display headings and a clean system sans stack for interface
  text. Use a monospace stack only for IDs, metrics, and source coordinates.

### Product styling

Create tokens, not scattered values:

- Cool white page and card surfaces.
- Ink/navy primary text and muted blue-grey supporting text.
- Violet-blue primary accent with pale lavender selection and evidence states.
- Subtle cool borders, restrained shadows, rounded cards, and generous space.
- Compact, quiet navigation and low-noise interaction.
- Strong focus rings, sufficient contrast, reduced-motion support, and minimum
  44px interactive targets on touch layouts.

Match information hierarchy and interaction from the two PRD reference images;
do not chase literal pixels at the expense of legibility or accessibility.

### Planned implementation packages

Create the architecture paths already approved:

```text
apps/web
apps/worker
packages/domain
packages/application
packages/ai
packages/database
packages/diagrams
packages/ui
packages/config
evals
fixtures
scripts
```

Add a focused nested `AGENTS.md` only after a real subtree exists and only when
it has rules that are more specific than the root file. Do not duplicate the
root instructions.

## Domain contracts

Use Zod schemas as the runtime source of truth and infer TypeScript types from
them. Use branded string IDs or an equivalent type-safe convention. All schema
versions start at `1` and are explicit in persisted or model-generated records.

| Record                    | Minimum V1 fields and rules                                                                                                                                                                              |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Paper`                   | `id`, `title`, `authors`, `lab`, `canonicalUrl`, `sourceType`, topic/mechanism labels, difficulty, and selection rationale. `sourceType` includes `PUBLIC`, `EXTERNAL_RESTRICTED`, and `SYNTHETIC_DEMO`. |
| `PaperVersion`            | `id`, `paperId`, version label, checksum, licence status, publication/revision dates, page count, and asset reference. Evidence may only attach to one version.                                          |
| `EvidenceSpan`            | `id`, `paperVersionId`, one-based page number, section, exact text, and one or more normalized `[x, y, width, height]` boxes constrained to `0..1`.                                                      |
| `Claim`                   | `id`, `reportId`, text, `kind`, `material`, support status, and evidence-span IDs. Kinds are `PAPER_FACT`, `AUTHOR_CLAIM`, `GLYPH_CALCULATION`, `GLYPH_INTERPRETATION`, and `INVESTMENT_HYPOTHESIS`.     |
| `Report`                  | `id`, `paperVersionId`, slug, status, reading time, progressive sections, claim IDs, concept IDs, visual IDs, timestamps, and editor approval metadata.                                                  |
| `ReportSection`           | `id`, report ID, required section kind, depth level, ordered content blocks, and connected claim/evidence IDs.                                                                                           |
| `Concept` / `ConceptCard` | Name, short definition, contextual explanation, relevance, optional analogy/visual, canonical source, related papers, and save state.                                                                    |
| `VisualSpec`              | Version, title, purpose, nodes, edges, groups, exact labels, optional values/units, claim IDs, evidence IDs, and deterministic layout hint. Unknown references fail validation.                          |
| `MarketMetric`            | Source, retrieval date, model/product version, value, unit, conditions, relevance, and comparison limitations. Missing context invalidates the metric.                                                   |
| `UserProfile`             | Demo user ID, role (`VISITOR`, `SUBSCRIBER`, `EDITOR`), preferences, and saved-concept IDs.                                                                                                              |
| `QuestionAnswer`          | Question, outcome (`ANSWER` or `INSUFFICIENT_EVIDENCE`), answer text, evidence IDs, and generated/validated timestamps. `ANSWER` requires evidence.                                                      |
| `PipelineRun`             | Paper-version ID, stage, attempt, idempotency key, status, stage result/error, and timestamps. Replaying a completed key must not duplicate effects.                                                     |

Publication eligibility is a domain function. It must return a structured list
of blocking reasons and fail closed when a material claim lacks evidence,
evidence belongs to another paper version, page mapping fails, a definition is
misleading, a visual references unknown claims/evidence, a market metric is
incomplete, claim kinds are ambiguous, or editor approval is absent.

## Demo fixture policy

Create one canonical fixture edition under `fixtures/glyph-agent-swarm-demo/`.
It must be unmistakably labelled “Synthetic Glyph demonstration — not a real
paper or investment analysis.”

The fixture contains:

- A deterministic two-to-four-page PDF generated locally with `pdf-lib` from a
  versioned source definition.
- A checksum calculated after generation.
- Section text and exact drawing coordinates produced by the same generator.
- Normalized evidence boxes derived from those coordinates, never estimated by
  eye.
- At least eight claims spanning all five semantic claim kinds.
- At least one supported claim, one deliberately unsupported claim, one
  contradictory evidence case, and one wrong-paper-version reference used only
  by tests.
- Five essential concept cards, including KV cache and multi-head latent
  attention as contextual teaching examples.
- One hero baseline-versus-proposed `VisualSpec`, two focused mechanism specs,
  and one concept-card spec.
- A complete progressive report, exact five-bullet newsletter, X preview, cited
  Q&A fixtures, and editor QA state.

Synthetic test content may be fictional but must not borrow a real lab, paper
title, benchmark number, citation, or company implication. Demo UI must always
show the synthetic-data badge.

## Routes and user flows

### Shared shell

- Persistent left navigation on desktop and compact sheet navigation on mobile.
- Routes for inbox, featured report, reader, concepts/library, editor, and
  distribution previews.
- Keyboard skip link, semantic landmarks, page titles, route-level loading and
  error boundaries, empty states, and a not-found page.
- A demo-role control that switches among visitor, subscriber, and editor
  entirely locally. It must be visibly marked as non-production.

### `/` — platform inbox

- “Today’s top papers” presentation with synthetic cards showing all required
  PRD metadata and statuses.
- One report-ready item links through the complete flow; other cards demonstrate
  queued, processing, and blocked states without pretending they are analysed.
- Filter controls for topic, mechanism, difficulty, and status.
- Empty and no-results behavior.

### `/reports/[slug]` — report landing

- Title, authorship/source identity, version/date, reading time, labels, save and
  share-preview controls, selection rationale, core investment question, main
  uncertainty, and key facts.
- Entry points to the report, source paper, concepts, diagrams, and monitoring
  items.
- Visitor can access the featured synthetic report. Archive/access restrictions
  are demonstrated with explicit permission UI, not hidden client-only checks.

### `/reader/[slug]` — split-screen reader

- Desktop keeps a PDF viewer on the left and the progressive report on the
  right. Each pane scrolls independently.
- Report claim/citation activation identifies its `EvidenceSpan`, changes the
  PDF page, scrolls to the exact box, draws the highlight, briefly emphasizes
  the connection, and announces the new evidence location for assistive tech.
- Selecting a highlight shows every connected claim without losing either pane’s
  position.
- Zoom and page controls preserve normalized highlight placement.
- Report depth tabs/sections expose five-minute, mechanism, and evidence layers.
- Technical sections are collapsed by default and preserve reader position when
  expanded.
- On mobile, the report is primary and “Open evidence” opens an accessible sheet
  containing the correct page and highlight. Closing the sheet returns focus to
  the triggering claim.
- Invalid, missing, wrong-version, and unmapped span IDs render explicit error
  states and never move to an approximate passage.

### Concept learning and `/library`

- Inline terms open accessible concept-card popovers on desktop and a sheet on
  mobile.
- Each card includes the required definition, context, relevance, analogy or
  small deterministic diagram, deeper-learning link, and related concepts.
- Save/unsave works through the application port and in-memory demo repository.
- The library shows saved concepts, saved reports, monitoring items, and clear
  empty states. Only concepts need full behavior overnight; other tabs may be
  honest read-only previews.

### Diagrams

- Render factual `VisualSpec` content through `packages/diagrams` as deterministic
  SVG. OpenAI-generated imagery is allowed only as optional non-semantic
  illustration and must never determine labels, arrows, topology, values,
  units, layout, or evidence relationships.

- Hero diagram compares baseline and proposed flow; focused diagrams explain
  information movement, stored/discarded state, and changed components.
- SVG includes a title, description, meaningful labels, and a text alternative.
- No image-generation model participates in labels, arrows, topology, numbers,
  or layout decisions.

### Cited Q&A

- Provide a constrained report Q&A panel backed by fixture corpus search.
- A supported question returns an answer and evidence links.
- An unsupported question returns `INSUFFICIENT_EVIDENCE` with no speculative
  prose.
- The panel is explicitly scoped to the selected report and has no unrestricted
  chat behavior.

### `/editor` — workflow and approval preview

- Show the full processing stages and current demo run state.
- Allow the editor demo role to run/reset the deterministic simulated pipeline,
  inspect QA blockers, and approve only when publication eligibility succeeds.
- Visitor and subscriber roles receive server-enforced permission errors.
- Approval changes only local demo state and never publishes externally.
- Surface idempotency keys, attempts, structured failures, and retry controls in
  a readable diagnostics view.

### Distribution previews

- Newsletter preview contains exactly five bullets in the PRD-defined order.
- X preview contains one hook, hero visual, three observations, canonical/demo
  source link, Glyph report link, and speculation disclaimer when needed.
- Buttons may copy preview text locally. Sending/posting controls remain disabled
  with an explanation.

## Application and provider interfaces

Define ports in `packages/application`; keep concrete adapters elsewhere:

- `PaperRepository`, `ReportRepository`, `ConceptRepository`, and
  `PipelineRunRepository` with in-memory demo implementations.
- `PaperAssetStore` for PDFs and visual assets, implemented by a local fixture
  store overnight.
- `AiGenerationGateway` with classification, extraction, synthesis, critique,
  and cited-answer methods. Provide a deterministic mock and an OpenAI Responses
  API adapter compiled and tested with mocked transport only.
- `SubscriptionGateway` with access-status and checkout-session contracts.
  Provide a demo adapter and a Stripe adapter shell; no live session creation.
- `AuthGateway` returning a server-validated demo session. Do not treat the
  client role selector as authorization evidence.
- `EmailGateway` and `SocialDistributionGateway` with preview-only adapters.
- `JobRunner` with deterministic local execution, structured retries, and
  idempotency.

Add a PostgreSQL schema and migration representing the domain records, including
vector-compatible fields where retrieval requires them. Use a provider-neutral
PostgreSQL driver/Drizzle adapter, but keep the running demo on in-memory
repositories so a database URL is not required. Database and all other SDK
clients must use lazy server-only getters.

## Milestones and gates

Complete in order. A later milestone may not compensate for a failing earlier
gate.

### Milestone 0 — scaffold and guardrails

Deliver:

- Root pnpm workspace, package manifests, shared configuration, environment
  example, ignore rules, README, and all planned package directories.
- Stable Next.js App Router app and worker entry point.
- Root commands listed in the verification contract below.
- Architecture-boundary verification that rejects forbidden imports.
- A baseline `docs/OVERNIGHT_HANDOFF.md` with all milestones marked pending.

Gate:

- Clean dependency install.
- Root lint, type-check, minimal unit test, and Next.js production build pass.
- No existing docs or reference images were removed or rewritten without need.

### Milestone 1 — domain, application ports, and fixture

Deliver:

- Versioned schemas and types for every core record.
- Publication eligibility, evidence-reference validation, market-metric
  validation, newsletter contract, and idempotency rules.
- Deterministic synthetic PDF/edition generator and checked fixture output.
- In-memory repositories and application use cases.

Gate:

- Unit tests cover valid, insufficient, contradictory, malformed,
  wrong-version, out-of-range coordinate, incomplete metric, blocked
  publication, and idempotent replay cases.
- Generating the fixture twice produces identical semantic content and checksum.
- No synthetic test record can be mistaken for publishable content.

### Milestone 2 — design system and application shell

Deliver:

- Glyph tokens, typography, components, icons, navigation, responsive shell,
  loading/error/empty patterns, and demo-role control.
- Inbox, report landing, library shell, and not-found flow.

Gate:

- Component tests cover critical states.
- Pages render at 1440×1000, 1024×768, and 390×844 without overflow, clipped
  controls, or unreadable text.
- Automated accessibility checks find no serious or critical violations.

### Milestone 3 — progressive report and concept learning

Deliver:

- Complete required report structure across the three progressive depth levels.
- Inline concept cards, save/unsave, related concepts, library behavior, cited
  Q&A states, and deterministic SVG visual system.

Gate:

- All difficult fixture terms have contextual cards.
- Every material visible claim resolves to valid fixture evidence or visibly
  reports insufficient evidence.
- VisualSpec validation rejects unknown claim/evidence IDs.
- Newsletter preview has exactly five bullets.

### Milestone 4 — evidence-linked PDF reader

Deliver:

- PDF rendering, normalized highlight overlay, bidirectional claim/highlight
  connection, independent panes, zoom/page controls, mobile evidence sheet,
  focus restoration, and error states.

Gate:

- Playwright verifies exact page/highlight for at least three claims.
- Playwright verifies multiple claims connected to one span.
- Invalid and wrong-version span tests show an error and never highlight a
  fallback location.
- Desktop report scroll position and mobile triggering focus are preserved.

### Milestone 5 — editor workflow and safe integrations

Deliver:

- Deterministic worker pipeline, editor diagnostics, QA blocker list,
  retry/idempotency behavior, and local approval preview.
- PostgreSQL migration, local asset adapter, mock AI gateway, compiled OpenAI
  adapter, demo subscription/auth adapters, Stripe shell, and disabled
  distribution adapters.
- Newsletter and X preview routes.

Gate:

- Worker integration test runs the complete demo pipeline.
- Re-running a completed stage does not duplicate outputs.
- Approval is impossible with each blocking condition and possible only when all
  blockers clear and the editor role is active.
- Tests prove default configuration cannot make a live provider call or external
  side effect.

### Milestone 6 — full-story verification and polish

Deliver:

- Browser coverage of the complete visitor, subscriber-demo, and editor-demo
  stories.
- Responsive screenshots, accessibility report, final review, repaired defects,
  and completed handoff.

Gate:

- `pnpm verify` passes from a clean local state.
- Production build starts and all required routes load without console errors.
- Playwright covers the PRD acceptance criteria that are meaningful with the
  synthetic fixture.
- Final screenshots are compared against both reference images for hierarchy,
  spacing, tone, and interaction clarity.
- `docs/OVERNIGHT_HANDOFF.md` honestly separates verified behavior, mocked
  integrations, unverified live services, and morning decisions.

## Verification contract

Create and maintain these root commands:

```text
pnpm format:check          formatting without rewrites
pnpm lint                  lint all workspaces
pnpm typecheck             strict TypeScript across all workspaces
pnpm test                  unit tests
pnpm test:integration      repositories, adapters, and worker flow
pnpm eval                  evidence/report integrity cases
pnpm verify:architecture   import boundaries and client/provider isolation
pnpm test:e2e              Playwright full user flows
pnpm build                 production builds
pnpm verify                all non-interactive required checks
pnpm dev                   local web development
pnpm pipeline:demo         deterministic local worker run
```

`pnpm verify` must include format check, lint, type-check, unit, integration,
eval, architecture verification, production build, and Playwright. Configure
Playwright's `webServer` so the browser suite is non-interactive.

Minimum automated scenarios:

- Valid claim/evidence mapping.
- Missing, contradictory, malformed, unknown, and wrong-version evidence.
- Normalized coordinate bounds and zoom-invariant highlights.
- Semantic claim-kind separation in report output.
- Missing market-metric timestamp, unit, version, or denominator.
- VisualSpec with unknown references or invalid numerical labels.
- Q&A supported answer and `INSUFFICIENT_EVIDENCE` outcome.
- Newsletter exact five-bullet contract.
- Publication blocked by every individual integrity rule and by missing editor
  approval.
- Worker retry and idempotent replay.
- Visitor, subscriber-demo, and editor-demo authorization boundaries.
- Desktop and mobile evidence navigation, focus restoration, and scroll
  preservation.
- Loading, empty, error, and permission states.
- Keyboard-only critical flow and automated accessibility scan.

Do not update snapshots blindly. Review every changed screenshot and repair real
regressions before accepting it.

## Failure and fallback rules

- If dependency installation is interrupted, retry with the existing pnpm store
  and record the exact failure. Do not switch package managers.
- If a chosen package is incompatible with stable Next.js, prefer a smaller
  standards-based implementation over a canary release.
- If PDF.js cannot render server-side, isolate it in the smallest client-only
  viewer boundary. Do not turn the whole reader into a client component.
- If browser automation cannot run, finish other checks but do not call the goal
  complete; record the blocker and exact reproduction command.
- If an optional provider requires credentials, keep the mock active and record
  live verification as pending. Do not invent credentials or make the build
  depend on them.
- If a product ambiguity affects factual integrity, publication, access, or a
  pending provider decision, choose the fail-closed behavior and record a
  morning decision instead of guessing.
- Never delete tests, loosen schemas, suppress errors, or relabel incomplete work
  to reach green status.

## Overnight progress reporting

Update `docs/OVERNIGHT_HANDOFF.md` after every milestone with:

- Current milestone and status.
- What was implemented.
- Focused checks run and their results.
- Screenshots or artifacts produced.
- Deviations from this plan and why.
- Blockers, missing credentials, or unverified behavior.
- Next milestone.

Keep commentary compact during the goal. A status update should name the current
checkpoint, verified result, remaining work, and whether a real blocker exists.

## Morning handoff checklist

The overnight goal must copy this checklist into `docs/OVERNIGHT_HANDOFF.md` and
fill every evidence field rather than merely checking boxes.

### 1. Read the handoff

- [ ] Confirm the final status: complete, partial, or blocked.
- [ ] Review the milestone table and every documented deviation.
- [ ] Confirm which integrations are mocked and which, if any, were live-tested.
- [ ] Read residual risks before opening the application.

### 2. Reproduce the build

Run from the repository root:

```bash
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm verify
```

- [ ] Versions match `.nvmrc` and the root `packageManager` field.
- [ ] Install succeeds without lockfile changes.
- [ ] `pnpm verify` passes on the morning machine/session.
- [ ] Any failure is compared with the exact overnight command and log.

### 3. Inspect the application

```bash
pnpm dev
```

- [ ] Inbox communicates title, source, claim, concepts, labels, difficulty,
      rationale, status, and reading time.
- [ ] Report landing page matches the reference hierarchy and visual tone.
- [ ] Five-minute layer makes the synthetic claim understandable.
- [ ] Mechanism and evidence layers expand without losing position.
- [ ] Desktop claim activation moves to the exact PDF page and highlight.
- [ ] Mobile “Open evidence” shows the exact passage and restores focus.
- [ ] Concept cards explain terms contextually and can be saved.
- [ ] Library reflects saved concepts.
- [ ] Diagrams show inputs, stored/discarded state, changed component, and
      baseline comparison.
- [ ] Supported Q&A cites evidence; unsupported Q&A returns
      `INSUFFICIENT_EVIDENCE`.
- [ ] Editor cannot approve a blocked report and approval never publishes.
- [ ] Newsletter has exactly five bullets and X remains preview-only.

### 4. Review visual and accessibility evidence

- [ ] Open every image under `work/overnight/screenshots/`.
- [ ] Compare desktop and mobile results with both files under
      `docs/references/`.
- [ ] Check hierarchy, serif/sans balance, whitespace, subtle borders, violet
      accents, diagram legibility, highlight visibility, and control density.
- [ ] Test the core flow with keyboard only.
- [ ] Confirm focus visibility, sheet/dialog focus restoration, reduced motion,
      contrast, and touch-target sizes.

### 5. Review integrity and security

- [ ] Search the diff for invented citations, real-paper claims, real companies,
      benchmark numbers, secrets, and machine-specific paths.
- [ ] Confirm every demo surface displays the synthetic-data label.
- [ ] Confirm material claims have valid same-version evidence.
- [ ] Confirm live AI, billing, email, social, and publication paths are disabled
      by default.
- [ ] Confirm authorization is rechecked server-side and not delegated to client
      role state or `proxy.ts`.
- [ ] Confirm provider SDKs initialize lazily and the production build succeeds
      without secrets.

### 6. Review the Git diff

```bash
git status --short
git diff --check
git diff --stat
```

- [ ] No unrelated files, generated caches, dependency stores, secrets, or
      temporary browser artifacts are tracked.
- [ ] Existing PRD, architecture, instructions, and UI references remain intact.
- [ ] No commit, push, pull request, or deployment occurred overnight.
- [ ] Run the review process in `docs/CODE_REVIEW.md` before deciding to commit.

### 7. Make the morning product decisions

- [ ] Choose the managed PostgreSQL/vector provider.
- [ ] Choose object storage.
- [ ] Choose invite-only authentication.
- [ ] Choose transactional email.
- [ ] Choose job scheduling/background execution.
- [ ] Choose hosting and observability.
- [ ] Supply and editorially verify the first canonical public paper.
- [ ] Decide whether to enable live OpenAI generation and which model roles to
      configure.
- [ ] Decide whether to connect Stripe test mode.
- [ ] Decide which milestone becomes the first committed/pushed branch.

### 8. Decide the next run

- [ ] Fix P0/P1 review findings before adding live integrations.
- [ ] Convert approved provider choices into architecture decisions.
- [ ] Replace synthetic content only through a verified extraction and editorial
      workflow.
- [ ] Keep publication and distribution disabled until human approval is tested
      with real permissions and staging services.

## Goal launch command

After network permission for public package installation is available, start the
overnight run with:

```text
/goal Implement PLAN.md milestone by milestone. Read AGENTS.md and every source
listed in PLAN.md before editing. Complete each milestone gate and repair
failures before continuing. Keep docs/OVERNIGHT_HANDOFF.md updated with verified
evidence. Do not make live provider calls, commit, push, deploy, publish, charge,
email, or post. Stop only when the PLAN.md stopping condition is satisfied or a
genuine fail-closed product decision prevents safe progress.
```
