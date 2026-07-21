# Glyph hackathon demo scope

Status: approved working assumption until the team changes it explicitly.

## Audience and job

Glyph is for an AI-focused investor or research analyst who needs to decide, in roughly five minutes, whether a frontier paper matters and what evidence supports that judgment.

## Demo promise

The demo will show one complete, inspectable path:

1. compare a deliberately small set of ranked candidate papers;
2. select one paper and understand why it ranked;
3. read an executive brief, then progressively inspect mechanism and limitations;
4. click a material claim to open its exact supporting passage;
5. see the product refuse an unsupported claim;
6. review a cautiously worded, sourced market implication;
7. record explicit reader feedback.

## Paper-independent build target

Until the real paper arrives, the application uses a conspicuously labelled synthetic fixture. The fixture exists only to make the routes, interactions, content contracts, responsive behavior, and demo timing testable. It must not appear in the final submission video or be described as real research.

## Final gold-paper content

- one paper and canonical PDF;
- five to seven material claims;
- two or more limitations or contradictions;
- exact evidence text plus page and normalized bounding box for every supported claim;
- one explicit insufficient-evidence case;
- three concept cards;
- one market implication with a cautious causal chain and sourced metric, or an explicit decision to omit market context;
- a three-to-four candidate ranking set with human rationales.

## Deferred beyond the hackathon slice

Production ingestion, account authentication, paid-tier boundaries, automated publishing, email distribution, durable personalization, and the complete source-governance backend remain roadmap work. Deferring these items does not alter the full PRD; it narrows only the hackathon demonstration.
