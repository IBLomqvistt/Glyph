# Glyph Product Requirements

## Product loop

Scan frontier sources -> rank 3-4 papers -> select one -> extract evidence -> explain it progressively -> connect defensible AI-market implications -> approve -> publish -> learn from user feedback.

## Roles

- **Berat** prepares product and editorial decisions, examples, gold-standard content, and approvals.
- **Ece** prepares technical and design artifacts and gives them to Codex for implementation.
- **Codex PM** plans delivery, tracks acceptance evidence, coordinates dependencies, and hands backend implementation to the `lead_backend_engineer` agent.

## Modules

| # | Module | Berat prepares | Ece prepares and gives Codex | Definition of Done |
|---|---|---|---|---|
| 1 | Product and UI | Final investor persona, example questions, expected report depth, public/paid boundary | Screen references, design tokens, route map, fixture data | Eight screens work with realistic fixture content on desktop and mobile. |
| 2 | Sources | Approved labs, authors, repositories, feeds and economic sources; source priorities and exclusions | `source_registry.csv`, rights policy, connector schemas | Editor can add, disable, test and audit approved sources. |
| 3 | Paper labelling | Label 20 pilot papers, then 50-100; write reasons for selection/rejection | Versioned label ontology, annotation UI, import/export | Every paper has complete labels and a human rationale; positive, negative and ambiguous examples exist. |
| 4 | Discovery | Define what makes a paper important and review historical ranking examples | Ranking weights, exclusions, deduplication and diversity rules | System presents 3-4 explainable candidates; editor selects one. |
| 5 | PDF and evidence | Highlight exact passages in three gold papers and connect them to claims | PDF.js viewer, normalized bounding boxes, evidence records and overlays | Clicking a claim opens the exact paper passage; zoom and mobile work correctly. |
| 6 | Claims and extraction | Write 15-30 gold claims per paper, including limitations and contradictions | Claim schemas, structured OpenAI prompts, validators and evals | Every material generated claim has valid evidence or returns insufficient evidence. |
| 7 | Reports and concepts | Write three complete gold reports and 25 concept cards | Report JSON schema, progressive levels, section generation and concept UI | Reader understands the paper in five minutes and can progressively inspect mechanism and evidence. |
| 8 | Diagrams and market context | Approve visual logic, economic causal chain, companies and relevant metrics | VisualSpec, SVG renderer, metric registry and comparison validator | Diagrams are evidence-linked; market data is sourced, timestamped and comparable. |
| 9 | QA and distribution | Approve headline, technical interpretation, trade implication, newsletter and X package | Publication blockers, approval workflow, newsletter/email tooling | No unsupported report publishes; newsletter has exactly five required bullets. |
| 10 | Personalization and beta | Define feedback reasons and judge whether recommendations were useful | Interest, knowledge and decision-value models; event tracking | Different users receive explainably different rankings without reducing global editorial quality. |

## Acceptance policy

- A module is Done only when every Definition of Done statement is verified with linked evidence.
- Generated material claims must be evidence-backed or explicitly return insufficient evidence.
- No unsupported report may be published.
- Product or editorial requirements can change only with explicit approval; proposed changes must remain visibly separate until approved.
