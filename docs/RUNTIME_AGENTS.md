# Glyph Runtime Agent System

Status: implemented foundation; production execution requires an OpenAI API key,
an approved label ontology, configured source connectors, and real paper inputs.

## Runtime boundary

Glyph runs eight semantic agents behind deterministic services. Agents can
classify, rank, extract, explain, review, and draft packages. They cannot change
the ontology, select the final paper, approve content, publish, or bypass a
validator.

| Agent                    | Output                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| `paper_classifier`       | Versioned labels, rule results, scores, confidence, rationale, and accept/reject/review decision |
| `shortlist_ranker`       | Three or four explainable, diverse candidates                                                    |
| `evidence_extractor`     | Version-locked claims, exact passages, page coordinates, limitations, and contradictions         |
| `paper_summarizer`       | Five-minute and progressive-depth report sections linked to claims and evidence                  |
| `concept_mapper`         | Deduplicated concept cards, dependencies, canonical sources, and evidence occurrences            |
| `market_context_analyst` | Sourced metrics and explicitly typed facts, calculations, interpretations, or hypotheses         |
| `integrity_reviewer`     | Blocking findings, warnings, and coverage measurements                                           |
| `editorial_packager`     | Review copy, social copy, and exactly five newsletter bullets                                    |

Every invocation is stored as an agent-run envelope with workflow, paper
version, agent/prompt version, model, attempt, warnings, structured result or
error, response ID, and timestamps.

## Deterministic services

- `SourceTrackerService` polls only enabled, non-prohibited sources. It supports
  manual and scheduled scans, records partial failures, and atomically
  deduplicates content hashes while preserving revised paper versions.
- `PaperLabelOntologyService` stores the editor-owned
  `paper-label-ontology.v1`. Active ontologies receive the authenticated editor
  and approval timestamp; workflows cannot accept rules inline.
- `RuntimeWorkflowService` classifies candidates, creates a 3–4-paper
  shortlist, pauses for editor selection, extracts evidence, runs summary,
  concepts and market context in parallel, reviews integrity, and creates an
  editorial package only after QA passes.
- `RuntimePublicationService` requires both a passed integrity record and a
  separate editor approval before changing a package to `PUBLISHED`.
- `DailySourceScanScheduler` provides the 24-hour worker schedule; deployment
  owns starting the worker and registering concrete source connectors.

## API workflow

Editor writes require the existing bearer token and `x-glyph-actor-id`.

1. Store or activate the ontology with
   `PUT /v1/paper-label-ontologies/paper-label-ontology.v1`.
2. Run retrieval with `POST /v1/source-scans`; inspect a scan with
   `GET /v1/source-scans/:id`.
3. Start classification and ranking with `POST /v1/runtime-workflows`, passing
   at least three paper-version IDs and the stored ontology ID.
4. Inspect the workflow and trace with `GET /v1/runtime-workflows/:id` and
   `GET /v1/runtime-workflows/:id/agent-runs`.
5. Select one shortlisted paper with
   `POST /v1/runtime-workflows/:id/select`.
6. Supply approved market records and run the selected paper with
   `POST /v1/runtime-workflows/:id/process`.
7. Review, approve, and publish through `/v1/editorial-packages/:id`,
   `/approve`, and `/publish`.

The API returns `503 RUNTIME_AGENTS_NOT_CONFIGURED` for semantic execution when
`OPENAI_API_KEY` is absent. Source governance and stored records remain
available without a model credential.

## Safety and failure behavior

- Paper text, metadata, URLs, and market records are explicitly treated as
  untrusted data rather than instructions.
- All model responses use strict JSON Schema and are parsed again with Zod.
- Unknown ontology rules, candidates, evidence IDs, paper versions, pages,
  concepts, and market-data indexes are rejected.
- Scores inside the ontology review band must return `NEEDS_REVIEW`.
- Refusals and malformed responses fail immediately. Timeouts, rate limits and
  retryable provider errors use bounded retries and end as explicit failed
  agent runs.
- Explicit trade recommendations are outside the schemas and prompts.
- Scheduled/manual overlap relies on a unique database fingerprint, so the
  same content version is ingested once.

## Production inputs still required

- the real editor-approved paper-label rules and examples;
- source-specific connector implementations and rights approvals;
- a real PDF parser that emits exact page text and normalized boxes;
- approved economic/market-data adapters;
- gold classification, evidence, summary, concept and integrity evaluations;
- a production queue/worker deployment and identity provider.
