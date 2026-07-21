# Glyph Overnight Handoff

> Historical note: the user withdrew the cloud/overnight requirement on
> 2026-07-21. Use `docs/HANDOFF_TODOS.md` for the current direct-local-build
> handoff.

Status: **partial — local fixture-driven V1 implemented; cloud execution and
Playwright launch remain blocked by the current environment**

Last updated: 2026-07-21

## Outcome

Glyph now has a runnable pnpm TypeScript monorepo, a production-building Next.js
application, a separate deterministic worker, framework-independent domain and
application packages, task-specific validated OpenAI output boundaries,
provider-neutral persistence records, deterministic SVG diagrams, a generated
three-page synthetic PDF, and a complete evidence-linked local demo.

The V1 is intentionally synthetic and local. Live AI, database, storage,
billing, email, social, publication, and deployment effects remain disabled.
Nothing was committed, pushed, deployed, published, charged, emailed, or posted.

## Execution environment

- Runtime: Node.js 22.21.0 and pnpm 11.9.0.
- Checkout: local Codex workspace on `main`, with no repository commits.
- Cloud: not launched. This checkout is not registered as a Codex cloud project,
  and the available task handoff does not support moving the active task into a
  cloud environment.
- RALF: no installed or documented Codex mode by that name was available. The
  build used the supported long-running goal loop: implement, verify, inspect,
  generalize each repair into tests or rules, and rerun affected checks.

## Milestone status

| Milestone                            | Status           | Evidence                                                                                                                                                                              |
| ------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Scaffold and guardrails          | Complete locally | Workspace, configs, root scripts, architecture verifier, frozen lockfile, and production build exist.                                                                                 |
| 1 — Domain, ports, and fixture       | Complete locally | Versioned schemas, ports, provider adapters, deterministic PDF/JSON fixture, 50 unit tests, 4 integration tests, and 16 integrity evals.                                              |
| 2 — Design system and shell          | Complete locally | Responsive shell and eight mobile routes audited with no overflow, unnamed controls, unlabeled visible fields, or sub-44 px targets.                                                  |
| 3 — Report and concept learning      | Complete locally | Progressive report, responsive concept cards, cookie-backed save/unsave, corpus-constrained cited Q&A, and four deterministic SVG diagrams.                                           |
| 4 — Evidence-linked reader           | Complete locally | Real PDF.js rendering, normalized boxes, exact page switching, connected-claim discovery, mobile sheet, focus restoration, and fail-closed invalid mappings.                          |
| 5 — Editor workflow and integrations | Complete locally | Idempotent ten-stage worker, structured failure/retry diagnostics, server-checked roles, a local review gate distinct from publication, lazy adapters, and disabled external effects. |
| 6 — Full verification and polish     | Partial          | All non-browser commands and in-app browser checks pass. Managed Chromium launch prevents Playwright and Axe from running.                                                            |

## Implemented surfaces

- `/` — daily inbox with ready, processing, queued, blocked, filtered-empty, and
  unavailable states plus combined status, topic, mechanism, and difficulty
  filters.
- `/reports/agent-swarm-demo` — public report landing with source/version facts,
  uncertainty, entry points, and deterministic hero diagram.
- `/reports/archive-preview` — explicit server-checked visitor denial and
  subscriber/editor permission state.
- `/reader/agent-swarm-demo` — desktop split reader and mobile evidence sheet.
- `/library` — saved concepts plus honest empty placeholders for future tabs.
- `/editor` — server-protected pipeline, structured failures, explicit retry,
  QA blockers, local approval, and disabled publication/distribution.
- `/previews/newsletter` and `/previews/x` — constrained local previews with no
  send/post action.
- Route-level loading, error, not-found, permission, blocked-publication, and
  `INSUFFICIENT_EVIDENCE` states.

## Verification log

| Check                            | Result              | Evidence                                                                                                                                                                                                          |
| -------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile` | Pass                | All ten workspace projects already up to date; lockfile unchanged.                                                                                                                                                |
| `pnpm format:check`              | Pass                | All matched files use Prettier formatting.                                                                                                                                                                        |
| `pnpm lint`                      | Pass                | All application and package lint tasks passed with zero warnings.                                                                                                                                                 |
| `pnpm typecheck`                 | Pass                | All nine participating workspace projects passed.                                                                                                                                                                 |
| `pnpm test`                      | Pass                | 50 tests across domain, application, AI, diagrams, persistence, provider safety, presentation components, fixtures, and integrity evals.                                                                          |
| `pnpm test:integration`          | Pass                | 4 worker replay, retry, failure, and fixture-storage tests.                                                                                                                                                       |
| `pnpm eval`                      | Pass                | 16 integrity evals, including every publication blocker category and field-level market-metric requirements.                                                                                                      |
| `pnpm verify:architecture`       | Pass                | Dependency direction and provider-call boundaries passed.                                                                                                                                                         |
| `pnpm generate:fixture` twice    | Pass                | PDF checksum stayed `5abee17781fa168cd5b85a5e3d91c3d0ed06f58b6bfc7d3e288fe6d2637c3329`; generated, formatter-stable JSON checksum is `e0bae7a4a00a4603151a2c2d99d518921ed6e559c1c964e0939d35fb46de04ac`.          |
| `pnpm pipeline:demo`             | Pass                | All ten pre-approval stages succeeded on attempt 1.                                                                                                                                                               |
| `pnpm build`                     | Pass                | Next.js 16.2.10 webpack production build compiled and generated every route without credentials; webpack avoids Turbopack's sandbox-only internal port worker.                                                    |
| In-app browser verification      | Pass                | Eight production routes had zero horizontal overflow at 1280 px; exact evidence pages, zoom-invariant geometry, fail-closed links, concept detail, role boundaries, retry, approval, and previews were exercised. |
| `pnpm setup:browsers`            | Historical pass     | Matching Playwright Chromium revision 1228 was temporarily installed during sandbox diagnosis; that workspace cache was later removed for the direct local workflow.                                              |
| `pnpm test:e2e` / `pnpm verify`  | Environment-blocked | The 28 scheduled desktop/mobile cases cannot start because Chromium's macOS Mach-port registration is denied before the first page; no application assertion runs.                                                |

## Evidence-integrity results

- The fixture contains 9 normalized evidence spans and 10 claims across paper
  facts, author claims, Glyph calculations, Glyph interpretations, and
  investment hypotheses.
- Supported, contradicted, and insufficient-evidence states are represented.
- Unknown evidence IDs and evidence from another paper version show explicit
  errors and render zero fallback highlights.
- A synthetic paper version is never publication-eligible, even after a local
  editorial review has no integrity blockers.
- Material unsupported claims, wrong-version evidence, out-of-range pages,
  unknown visual references, invalid page mappings, unvalidated definitions,
  ambiguous claim kinds, incomplete market metrics, missing approval status, and
  missing editor metadata each block publication in automated tests.
- The demonstrated investment conclusion is allowed to remain “no direct trade
  implication.”
- Analytical labels, arrows, topology, values, units, and evidence links are
  generated only from validated `VisualSpec` data and deterministic SVG.

## Browser and accessibility evidence

The production build was checked at 1440 × 1000, 1024 × 768, and 390 × 844 in
the earlier browser pass, then rechecked at 1280 px after the final repairs.
The final mobile route audit found exactly one `h1` per route, no page overflow,
no unnamed controls, no unlabeled visible fields, no undersized visible mobile
targets, and no framework error overlay. Closing the evidence sheet restored
focus to `Open evidence`. Four reader diagrams rendered from validated specs.

Artifacts:

- [Desktop report](../work/overnight/screenshots/report-final-1440x1000.jpg)
- [Desktop diagram gallery](../work/overnight/screenshots/reader-diagrams-1440x1000.jpg)
- [Mobile exact-evidence sheet](../work/overnight/screenshots/reader-mobile-final-390x844.jpg)
- [Inbox](../work/overnight/screenshots/inbox-browser.png)
- [Tablet report](../work/overnight/screenshots/report-1024x768.png)
- [Newsletter preview](../work/overnight/screenshots/newsletter-1440x1000.png)
- [Accessibility report](../work/overnight/accessibility-report.md)

## Mocked and disabled integrations

| Capability                 | V1 state                                                                                                                                              | Morning decision                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| OpenAI Responses API       | Lazy adapter, task-specific strict outputs, reproducibility record, corpus-bound cited-answer validation, and mocked transport tests; live calls off. | Supply credentials only after prompt/schema and data-policy review.                |
| GPT Image 2                | Reserved for optional non-semantic illustration; unused.                                                                                              | Decide whether V1 needs illustration at all.                                       |
| PostgreSQL/vector search   | Provider-neutral Drizzle schema/migration, AI-generation records, and lazy paper adapter; no live database.                                           | Select a managed provider and document residency, security, backup, and migration. |
| Object storage             | Deterministic local fixture store only.                                                                                                               | Select storage after licensing policy is agreed.                                   |
| Authentication             | Clearly marked local cookie roles.                                                                                                                    | Choose invite-only production authentication.                                      |
| Stripe                     | Compiled subscription adapter shell and lazy SDK boundary; checkout remains disabled.                                                                 | Decide whether to connect test mode.                                               |
| Email and social           | Preview-only; send and post disabled.                                                                                                                 | Choose providers only after publication approval is staging-tested.                |
| Jobs/hosting/observability | Deterministic local worker; no deployment.                                                                                                            | Select vendors through architecture decisions.                                     |

## Deviations and residual risks

1. The requested cloud overnight run could not start because Glyph is absent
   from the Codex cloud project list. Local work continued under the active goal.
2. The repository has no initial commit, so all intended files appear as
   untracked and `git diff` cannot describe them. Review `git status --short` and
   the complete tree before the first commit.
3. A matching Playwright Chromium revision was tested, but launch was denied by
   the managed macOS sandbox
   (`MachPortRendezvousServer`, permission error 1100). All 28 scheduled cases,
   including Axe checks, stop before opening a page. Run them outside the
   sandbox.
4. No real paper, production identity, vendor credentials, or provider services
   were used. Production data handling, licensing, authorization, rate limits,
   costs, migrations, and failure recovery remain unverified.
5. The local role cookie and local approval cookie are deliberately demo-only;
   they are not a production security model.

## Morning handoff checklist

### 1. Read the handoff

- [x] Final status is **partial**. Evidence: milestones 0–5 pass locally;
      milestone 6 is blocked only at managed-browser/cloud execution.
- [x] Milestone table and deviations are filled above.
- [x] Integrations are enumerated as mocked or disabled; none were live-tested.
- [x] Residual risks are listed before application review.

### 2. Reproduce the build

Run from the repository root:

```bash
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm setup:browsers
pnpm verify
```

- [x] Overnight versions matched `.nvmrc` and `packageManager`: Node 22.21.0,
      pnpm 11.9.0.
- [x] Frozen install passed without lockfile changes.
- [x] The matching browser revision was installed during diagnosis. Run
      `pnpm setup:browsers` in a normal Terminal to restore it to Playwright's
      standard cache before running the suite.
- [ ] `pnpm verify` must be rerun on the morning machine. Expected difference:
      a machine that permits Chromium launch should reach all 28 scheduled
      desktop/mobile cases.
- [x] If it fails, compare with the exact sandbox reproduction under
      “Deviations and residual risks.”

### 3. Inspect the application

Run `pnpm dev`, then use these overnight observations as the review baseline:

- [x] Inbox shows title, source, claim, concepts, labels, difficulty, rationale,
      status, and reading time.
- [x] Report landing follows the supplied serif-led, violet, low-noise hierarchy.
- [x] Five-minute layer explains the synthetic mechanism before interpretation.
- [x] Mechanism and evidence tabs expand within the fixed report pane.
- [x] Desktop evidence activation selects exact pages 1, 2, and 3 with normalized
      highlights; invalid mappings never fall back.
- [x] Mobile `Open evidence` shows the mapped passage and restores trigger focus.
- [x] Desktop popovers and mobile sheets explain terms in context, show related
      concepts/structured visuals, and save/unsave locally.
- [x] Library reflects saved concepts and labels unimplemented tabs honestly.
- [x] Four diagrams cover baseline/proposal, information movement, retained and
      discarded state, and changed components.
- [x] Supported Q&A cites evidence; unsupported Q&A returns
      `INSUFFICIENT_EVIDENCE` with no answer text.
- [x] Editor actions are server-denied to visitor/subscriber roles; local
      approval never publishes.
- [x] Newsletter has exactly five bullets; X is preview-only.

### 4. Review visual and accessibility evidence

- [x] Open the seven artifacts linked above.
- [x] Overnight comparison used both files under `docs/references/`; morning
      approval of visual fidelity is still a human product decision.
- [x] Hierarchy, typography balance, whitespace, borders, violet accents,
      highlights, control density, and diagram legibility were inspected.
- [x] Skip link, tabs, concept sheet, evidence sheet, role switch, and editor
      controls were keyboard-exercised in the in-app browser.
- [x] Focus restoration, reduced motion, and touch targets were inspected.
- [ ] Run the pending Playwright/Axe scan on a browser-capable machine before
      treating accessibility verification as complete.

### 5. Review integrity and security

- [x] Source search found no real-paper claims, real-company claims, secrets, or
      machine-specific paths in intended repository documents/code.
- [x] Every product route carries the synthetic-data disclosure through the
      shared shell or page banner.
- [x] Automated tests prove material claims use same-version evidence.
- [x] Live AI, billing, email, social, publication, and deployment are off by
      default.
- [x] Authorization is checked in server actions/pages, not trusted from client
      display state.
- [x] Provider clients initialize lazily; production build passes without
      secrets.

### 6. Review the Git diff

```bash
git status --short
git diff --check
git diff --stat
```

- [x] No generated caches, dependency stores, secrets, or browser reports are
      intended for tracking; `work/` is ignored.
- [x] PRD, architecture, instructions, task template, review guide, plan, and
      both reference images remain present.
- [x] No commit, push, pull request, deployment, publication, or external
      message occurred.
- [ ] Because the repository has no initial commit, review every untracked file
      and run `docs/CODE_REVIEW.md` before creating the first commit.

### 7. Make the morning product decisions

- [ ] Choose managed PostgreSQL/vector search.
- [ ] Choose object storage.
- [ ] Choose invite-only authentication.
- [ ] Choose transactional email.
- [ ] Choose job scheduling/background execution.
- [ ] Choose hosting and observability.
- [ ] Supply and editorially verify the first canonical public paper.
- [ ] Decide whether to enable live OpenAI generation and assign model roles.
- [ ] Decide whether to connect Stripe test mode.
- [ ] Decide which milestone becomes the first committed and pushed branch.

### 8. Decide the next run

- [ ] Register Glyph as a Codex cloud project if a cloud run is still desired.
- [ ] Run Playwright/Axe outside the restricted macOS sandbox and repair any
      P0/P1 result before live integrations.
- [ ] Convert approved provider choices into architecture decisions.
- [ ] Replace synthetic content only through verified extraction and human
      editorial review.
- [ ] Keep publication and distribution disabled until real authorization and
      staging approval are verified.
