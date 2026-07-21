# Glyph Project Status

Last updated: 2026-07-21
Audit basis: complete repository file scan on 2026-07-21

## Executive summary

Glyph now has two runnable foundations: an evidence-first TypeScript backend and a responsive, dependency-free product prototype. The frontend exposes eight connected views—Discover, Paper, Brief, Evidence, Concepts, Market, Review, and Feedback—using an explicitly synthetic paper fixture. The backend provides governed source operations, domain and application services, editorial gates, an idempotent worker, PostgreSQL schema/migration support, and an in-memory development adapter.

The backend also implements the eight-agent runtime foundation: stored
editor-approved labeling rules, scheduled/manual source scans, content-version
deduplication, classification, explainable shortlisting, evidence extraction,
parallel summary/concept/market analysis, integrity review, editorial packaging,
and two explicit human gates. Concrete live connectors, real labeling rules,
gold evaluations, and a credentialed real-paper run remain outstanding.

The combined verification command passes 8 frontend tests and 21 backend/package tests, plus backend formatting, lint, type checking, and builds. No full module Definition of Done is complete: the real gold paper, human-checked evidence, approved source policy, production connectors, responsive visual evidence, external deployment, and submission artifacts remain missing.

## Repository audit

| Area               | Finding                                                                                                             | Evidence / implication                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Product code       | Eight hash-routed frontend views plus API, worker, domain, application, and database packages                       | The synthetic vertical slice and backend foundation can be exercised locally; they are not yet connected end to end.                        |
| Project setup      | pnpm workspace, documented web/API run paths, static frontend build, TypeScript backend builds, environment example | Fresh-install verification still needs an independent clean-clone tester.                                                                   |
| Data and schemas   | Versioned backend domain schemas, PostgreSQL migration, in-memory adapter, and a synthetic content/evidence fixture | The fixture is deliberately non-submittable; real source records, PDFs, gold labels, and human evidence checks are missing.                 |
| Verification       | 8 frontend tests and 21 backend/package tests pass; backend format, lint, type check, and builds pass               | Browser visual evidence, accessibility automation, real PDF overlays, a credentialed provider run, and production deployment checks remain. |
| Product management | PRD and status ledger exist                                                                                         | Delivery scope and acceptance framework are documented in `docs/PRD.md`.                                                                    |
| Agent support      | PM and backend engineer agent definitions exist                                                                     | Planning/tracking and future backend delegation roles are configured under `.codex/agents/`.                                                |

## Current milestone

Replace the synthetic fixture with one real gold paper and human-checked evidence, then connect the existing frontend slice to the backend foundation. Capture desktop/mobile verification evidence without building production connectors before the rights policy and approved-source list exist.

## Hackathon submission readiness

The submission workflow is prepared under [`submission/`](../submission/README.md), including a Devpost copy deck, a sub-three-minute narrated demo script, recording and YouTube instructions, repository-access requirements, an evidence tracker, and a hard-gate checklist. A local preflight is available at `./scripts/submission-audit.sh`.

The package is **not submission-ready** despite the runnable prototype. The current preflight still reports these open gates: no commit, no `origin` remote, unresolved verification markers, an incomplete final checklist, no YouTube URL, and no Codex `/feedback` Session ID. Repository visibility and required private-repository sharing cannot be checked until a remote repository exists.

The rough core experience and demo plan now exist, but the real research content, main-thread `/feedback` ID, commits, remote repository, Devpost team acceptance, and final media do not. With the stated deadline of Tuesday, July 21, 2026 at 5:00 PM PT, those are critical-path requirements rather than later polish.

## Module ledger

| #   | Module                      | Status      | Verified progress                                                                                                                                                    | Missing for Definition of Done                                                                                                                                               | Next owner / action                                                              |
| --- | --------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | Product and UI              | In progress | Working persona assumption, route map, synthetic fixture, shared tokens, eight responsive views, run/build/test path, 8 passing tests.                               | Team approval of persona and boundary, real paper content, empty/loading/error coverage, independent clean-clone test, desktop/mobile visual evidence, accessibility review. | Berat approves the demo scope; Ece/Codex replace the fixture and run acceptance. |
| 2   | Sources                     | In progress | Governed source domain, authenticated API operations, persistence adapters, audit behavior, and focused tests exist.                                                 | Approved sources/exclusions, rights policy, registry CSV, real connector implementations, editor UI, and end-to-end acceptance.                                              | Berat/Ece complete `GLY-006` and `GLY-007` before live connectors.               |
| 3   | Paper labelling             | Not started | PRD criterion is documented.                                                                                                                                         | Pilot corpus, 20 then 50-100 labels, rationales, ontology, positive/negative/ambiguous examples, annotation UI, import/export, completeness validation.                      | Start after source corpus and ontology inputs are available.                     |
| 4   | Discovery                   | Not started | PRD criterion is documented.                                                                                                                                         | Importance definition, historical examples, ranking weights, exclusions, deduplication, diversity, explainability, candidate selection UI and tests.                         | Start after initial labels exist.                                                |
| 5   | PDF and evidence            | In progress | Claim-to-evidence interaction, normalized fixture boxes, and explicit insufficient-evidence state exist.                                                             | Gold PDFs, human evidence records, PDF.js rendering, real overlays, zoom/mobile verification.                                                                                | Attach the first gold paper using `docs/PAPER_HANDOFF.md`.                       |
| 6   | Claims and extraction       | In progress | Domain/frontend claim states plus a tested GPT-5.6 Terra Responses boundary enforce strict output, known evidence IDs, refusals, and insufficient-evidence behavior. | Gold claims, credentialed run on the real paper, human comparison, evaluation cases, and pass thresholds.                                                                    | Start the gold set when the paper arrives, then run the provider boundary.       |
| 7   | Reports and concepts        | In progress | Progressive executive/mechanism/evidence views and three concept-card interactions exist against the fixture.                                                        | Gold reports/concepts, generation pipeline, schema validation, and comprehension testing.                                                                                    | Replace fixture content and validate a five-minute read.                         |
| 8   | Diagrams and market context | In progress | A four-link causal chain visibly separates represented from unsupported economic claims.                                                                             | Approved VisualSpec, real companies/metrics, timestamps, source links, and comparison validation.                                                                            | Decide whether the real paper supports a market implication.                     |
| 9   | QA and distribution         | In progress | Frontend review gates and backend editorial publication controls block incomplete work.                                                                              | Approved editorial inputs, real end-to-end workflow, newsletter/email tooling, X package, and five-bullet validation.                                                        | Connect review UI to the backend after the gold paper is present.                |
| 10  | Personalization and beta    | In progress | Explicit feedback-reason UI demonstrates explainable preference without changing evidence standards.                                                                 | Consent-aware durable events, user models, ranking differences, beta data, and global-quality validation.                                                                    | Keep local-only until consent and event contracts are approved.                  |

## Acceptance scorecard

| Module                         | Definition of Done verified | Evidence                                                                                                |
| ------------------------------ | --------------------------: | ------------------------------------------------------------------------------------------------------- |
| 1. Product and UI              |                          No | Eight synthetic views and tests exist; approved real content and responsive acceptance evidence do not. |
| 2. Sources                     |                          No | Registry/API/audit foundation exists; policy inputs, live connectors, and editor acceptance do not.     |
| 3. Paper labelling             |                          No | No labelled corpus, ontology, or annotation tooling exists.                                             |
| 4. Discovery                   |                          No | No ranking implementation or explainable candidate set exists.                                          |
| 5. PDF and evidence            |                          No | Fixture interaction exists; no real PDF viewer, gold evidence, or verified overlays.                    |
| 6. Claims and extraction       |                          No | Claim states/contracts exist; no gold set, provider prompts, validators, or eval pass.                  |
| 7. Reports and concepts        |                          No | Progressive fixture UI exists; no gold reports or comprehension validation.                             |
| 8. Diagrams and market context |                          No | Fixture causal-chain UI exists; no approved sourced market comparison.                                  |
| 9. QA and distribution         |                          No | Publication gates exist; no complete approval/distribution workflow.                                    |
| 10. Personalization and beta   |                          No | Local feedback UI exists; no consent-aware model or beta validation.                                    |

## Decisions

| Date       | Decision                                                                                                                                                                                                     | Owner                      | Rationale / evidence                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- | --------------------------------------------------------------------------------------------------------- |
| 2026-07-21 | Use the ten PRD modules and their Definitions of Done as the delivery and acceptance framework.                                                                                                              | Product                    | `docs/PRD.md`                                                                                             |
| 2026-07-21 | Supersede the initial pre-implementation audit: executable frontend and backend foundations now exist, but do not satisfy a module Definition of Done without the PRD's real inputs and acceptance evidence. | Codex PM + implementation  | The combined workspace builds and passes automated tests; the module ledger records the remaining gates.  |
| 2026-07-21 | Build Module 1 with realistic fixtures before depending on production backend services.                                                                                                                      | Codex PM                   | The Module 1 Definition of Done is independently demonstrable with the inputs assigned in the PRD.        |
| 2026-07-21 | Use a clearly labelled synthetic paper only to unblock structure and interaction work.                                                                                                                       | Codex                      | `docs/DEMO_SCOPE.md`; synthetic content must be replaced before submission.                               |
| 2026-07-21 | Keep unsupported market conclusions and incomplete editorial work visibly blocked.                                                                                                                           | Codex + backend foundation | Frontend evidence/review states and backend publication gates pass combined verification.                 |
| 2026-07-21 | Use GPT-5.6 Terra only for structured drafting from pre-selected evidence spans, with low reasoning effort and `store: false`.                                                                               | Codex + product            | `packages/openai` and `docs/OPENAI_INTEGRATION.md`; live use still requires a credentialed, recorded run. |
| 2026-07-21 | Use eight specialized semantic agents behind deterministic source, workflow, integrity, and publication services; keep editor selection and publication approval mandatory. | Codex + product | `docs/RUNTIME_AGENTS.md`; the backend test suite validates the foundation without live provider calls. |

## Active handoffs

| Task               | Module | From  | To                    | Status                               | Acceptance criteria                                                                                                                                                   | Evidence                                                |
| ------------------ | ------ | ----- | --------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| GLY-008 foundation | 2      | Codex | Lead backend engineer | Implemented; awaiting product inputs | Persistence, management API, connector boundary, audit trail, authentication, and focused tests exist; approved registry and live connectors remain gated by GLY-007. | `apps/api`, `packages/application`, `packages/database` |

## Risks and blockers

| Priority | Risk / blocker                                                                                                     | Owner                  | Mitigation / next decision                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Critical | The runnable product still uses a synthetic paper and cannot support final claims or video recording.              | Berat + Codex          | Supply the paper using `docs/PAPER_HANDOFF.md`, then build and human-check its evidence set.                               |
| Critical | There is no commit, remote, repository access check, `/feedback` ID, or YouTube/Devpost proof.                     | Team                   | Establish the remote and main build thread, then follow `submission/README.md`.                                            |
| High     | The GPT-5.6 boundary is contract-tested but has not made a credentialed call on real paper evidence.               | Codex + human reviewer | After the paper handoff, run once with a runtime key, safely record the returned model/request ID, and review every claim. |
| High     | The investor persona assumption and public/paid boundary are not approved.                                         | Berat                  | Review `docs/DEMO_SCOPE.md` and complete the remaining `GLY-001` decisions.                                                |
| High     | Visual behavior has not been accepted on representative desktop/mobile browsers.                                   | Ece + Codex            | Run responsive, keyboard, overflow, and accessibility acceptance after real content lands.                                 |
| High     | Source rights, priorities, and exclusions are undefined; premature connector work could ingest disallowed content. | Berat, Ece             | Complete `GLY-006` and `GLY-007` before production connector implementation.                                               |
| Medium   | No gold corpus or evaluation datasets exist, so discovery and extraction quality cannot be measured.               | Berat                  | Build the labelled and evidence-linked gold sets in the PRD sequence.                                                      |
| Medium   | Later modules depend on contracts that do not yet exist, creating rework risk if implemented early.                | Codex PM               | Gate each module on the dependencies recorded in `docs/TODO.md`.                                                           |

## Next three tasks

1. Attach the real gold paper using `docs/PAPER_HANDOFF.md` and approve the working investor persona.
2. Replace the synthetic fixture with 5–7 human-checked claims, limitations, concepts, and exact evidence passages.
3. Connect the strongest demo flow to the backend, capture desktop/mobile acceptance evidence, and establish the Git remote/main `/feedback` session.

The full prioritized backlog is maintained in `docs/TODO.md`.

## Status rules

- **Not started:** no accepted product deliverable exists.
- **In progress:** work or prerequisite inputs exist, but at least one acceptance criterion remains unmet.
- **Blocked:** no meaningful progress is possible until the named owner resolves the recorded blocker.
- **Ready for acceptance:** implementation is present and verification evidence is assembled, but product/editorial acceptance is pending.
- **Done:** every Definition of Done criterion is verified and linked in the module ledger.
