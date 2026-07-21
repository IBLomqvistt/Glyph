# Glyph

Glyph is a paper-intelligence prototype for turning frontier research into evidence-linked explanations and defensible AI-market context.

> **Current status (2026-07-21): backend foundation, runnable product slice, and one real-source worked example.** The evidence-first domain, governed source API, editorial publication gates, idempotent worker, PostgreSQL schema, and local in-memory adapter are runnable. Eight responsive product views still use a conspicuously labelled synthetic paper; the separate Kimi K3 Models and Reader routes use an attached first-party printout and the supplied provisional Glyph launch analysis. Do not describe Glyph as submission-ready until the real example is human checked and the gates in [`submission/FINAL_CHECKLIST.md`](submission/FINAL_CHECKLIST.md) pass.

## Product loop

Scan frontier sources → rank 3–4 papers → select one → extract evidence → explain it progressively → connect defensible market implications → approve → publish → learn from feedback.

The product requirements and acceptance framework live in:

- [`docs/PRD.md`](docs/PRD.md)
- [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md)
- [`docs/TODO.md`](docs/TODO.md)

## Running the product prototype

Requirements: Node.js 22+ and pnpm 11.9.

```bash
pnpm install
pnpm dev
```

Open `http://127.0.0.1:4173`. The dependency-free frontend is served directly, so content and interface changes do not require a rebuild. It includes eight views: Discover, Paper, Brief, Evidence, Concepts, Market, Review, and Feedback.

Frontend-only checks also run without rebuilding:

```bash
pnpm test:frontend
```

Create and preview the static production output with `pnpm build` and `pnpm preview`.

### Kimi K3 worked example

- Models category: `http://127.0.0.1:4173/layers/models`
- Evidence Reader: `http://127.0.0.1:4173/reader/kimi-k3-open-frontier-intelligence`

The Reader separates the attached 21-page Kimi launch-blog printout and its normalized evidence coordinates from the complete supplied `Glyph №1` editorial analysis. The analysis is labelled provisional and not independently validated; it is not presented as the official Kimi technical report, which the source announces but does not include.

## Running the backend

Copy `.env.example` to `.env`, set a long random `GLYPH_EDITOR_TOKEN`, and keep `GLYPH_ALLOW_IN_MEMORY=true` for ephemeral local development. Export those values, then run:

```bash
pnpm dev:api
```

The API listens on `http://127.0.0.1:4000`; OpenAPI documentation is available at `/docs`. For PostgreSQL, set `DATABASE_URL` and run `pnpm --filter @glyph/database migrate` before starting the API.

Verification:

```bash
pnpm verify:backend
```

Backend boundaries and deferred capabilities are documented in
[`docs/BACKEND_ARCHITECTURE.md`](docs/BACKEND_ARCHITECTURE.md).

To execute the eight semantic runtime agents, provide `OPENAI_API_KEY` only in
the runtime environment and keep `OPENAI_MODEL=gpt-5.6-terra`. The source
tracker, stored ontology, workflow trace, and publication gates work without a
model key; semantic workflow execution fails closed until the key is present.
See [`docs/RUNTIME_AGENTS.md`](docs/RUNTIME_AGENTS.md) for the API sequence and
the production inputs that are still required.

Before submission, a person who did not build the project must clone the repository into a clean directory and successfully follow the final Quickstart without undocumented steps.

## Replacing the synthetic paper

The handoff format is documented in [`docs/PAPER_HANDOFF.md`](docs/PAPER_HANDOFF.md). The product reads its current fixture from [`src/demo-content.mjs`](src/demo-content.mjs); replace it only after every material claim and exact supporting passage has been human checked.

## OpenAI boundary

The tested GPT-5.6 boundary lives in [`packages/openai`](packages/openai/src/index.ts). It uses the Responses API with GPT-5.6 Terra to draft structured content only from evidence spans supplied by the application, then rejects unknown citations and malformed support states. No live key is needed for tests. See [`docs/OPENAI_INTEGRATION.md`](docs/OPENAI_INTEGRATION.md).

## How Codex and GPT-5.6 were used

So far, Codex has been used to structure the product requirements, maintain the acceptance ledger, audit repository readiness, prepare the hackathon submission workflow, implement and test the evidence-first backend foundation, define the paper/evidence contracts, implement the eight-view responsive prototype, and add the tested GPT-5.6 structured-output boundary. The final README must still be updated with specific reviewed examples and the main build-session ID before submission, including:

- which product or engineering tasks Codex completed and which a team member reviewed;
- where GPT-5.6 was used in the running product, if applicable;
- one concrete example of the input, generated output, and human verification;
- safeguards used to keep claims linked to evidence or return insufficient evidence;
- relevant Codex `/feedback` session ID.

Do not replace these specifics with a generic claim that “AI helped us build faster.”

## Hackathon submission

The submission command center is [`submission/README.md`](submission/README.md). It includes the Devpost draft, sub-three-minute demo script, recording and YouTube runbook, repository-access instructions, evidence tracker, and final audit checklist.
