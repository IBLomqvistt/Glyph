# Glyph Backend Architecture

Status: foundation implemented; live product integrations remain gated by the PRD.

## Shape

Glyph uses a strict TypeScript pnpm workspace organized as a modular monolith:

```text
apps/api            Fastify REST/OpenAPI server and operational endpoints
apps/worker         Idempotent asynchronous pipeline entry point
packages/domain     Framework-independent schemas and publication invariants
packages/application Use cases and provider-neutral ports
packages/database   In-memory adapter, PostgreSQL adapter, schema and migration
packages/openai     Shared structured-output transport and eight runtime agents
```

Dependency direction is `api/worker -> application -> domain`; the database
package implements application ports. Provider-specific source, AI, auth,
distribution, and job systems must remain behind application interfaces.

## Implemented contracts

- Governed source registry with rights status, enable/disable rules, connector
  keys, editor identity, and append-only audit events.
- Versioned papers and paper versions with checksums, licence state, page count,
  and asset references.
- Page-relative evidence boxes, explicit claim kinds, support status, progressive
  report sections, concept cards, evidence-linked visual specifications, and
  fully contextualized market metrics.
- Idempotent pipeline runs for discovery through distribution. Retried work
  reuses the idempotency key; failures are stored explicitly rather than
  returning success-shaped fallback data.
- Editorial approval and publication services that reject unsupported material
  claims, mismatched evidence versions, out-of-range pages, unknown visual
  references, invalid metrics, incomplete integrity checks, and missing editor
  approval.
- Eight persisted runtime-agent contracts, stored editor-owned label ontology,
  governed source scans, version-aware ingestion, explainable shortlisting,
  human selection/publication pauses, and bounded provider retries.

## API

Run `pnpm dev:api`, then open `http://127.0.0.1:4000/docs`.

Public reads:

- `GET /health/live`
- `GET /health/ready`
- `GET /v1/sources`
- `GET /v1/sources/:id/audit`
- `GET /v1/papers/:id`
- `GET /v1/reports/:slug`
- `GET /v1/pipeline/runs/:idempotencyKey`
- `GET /v1/runtime-agents`
- `GET /v1/source-scans/:id`
- `GET /v1/runtime-workflows/:id`
- `GET /v1/runtime-workflows/:id/agent-runs`
- `GET /v1/editorial-packages/:id`

Editor writes require both `Authorization: Bearer <GLYPH_EDITOR_TOKEN>` and an
`x-glyph-actor-id` header so every mutation has an auditable actor:

- `POST /v1/sources`
- `PATCH /v1/sources/:id/enabled`
- `POST /v1/sources/:id/test`
- `POST /v1/papers`
- `POST /v1/paper-versions`
- `POST /v1/reports/:id/approve`
- `POST /v1/reports/:id/publish`
- `POST /v1/pipeline/runs`
- `PUT /v1/paper-label-ontologies/:id`
- `POST /v1/source-scans`
- `POST /v1/runtime-workflows`
- `POST /v1/runtime-workflows/:id/select`
- `POST /v1/runtime-workflows/:id/process`
- `POST /v1/editorial-packages/:id/approve`
- `POST /v1/editorial-packages/:id/publish`

The editor token is a bootstrap adapter, not the final authentication design.
Replace it behind an auth gateway after the invite-only beta identity provider
is approved.

## Persistence and migration

For local contract work, set `GLYPH_ALLOW_IN_MEMORY=true`; data is intentionally
ephemeral. Production rejects in-memory mode.

For PostgreSQL, set `DATABASE_URL`, then run:

```bash
pnpm --filter @glyph/database migrate
pnpm dev:api
```

Migrations are discovered and applied in filename order, recorded in
`glyph_migrations`, and create normalized tables
for sources, audits, papers, versions, reports, sections, evidence, claims,
claim-evidence links, concepts, visual specifications, market metrics, and
pipeline runs, ingested documents, source scans, label ontologies, agent runs,
runtime workflows, and editorial packages.

## Deferred capabilities

The OpenAI package now provides all eight structured runtime agents and rejects
unknown cross-record references. Execution remains disabled without a runtime
credential and an editor-approved stored ontology. The PRD inputs required for
live source connectors, final ranking rules,
labelled training data, gold evidence, report fixtures, market-data
comparability, distribution providers, consent-aware analytics, and final auth
also have not been supplied. The backend therefore keeps those integrations
behind explicit boundaries rather than inventing vendor behavior.
