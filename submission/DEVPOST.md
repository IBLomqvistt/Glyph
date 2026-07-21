# Devpost copy deck — Glyph

> **Draft only.** Text inside `[VERIFY: ...]` is not paste-ready. Remove every marker only after matching it to the final build and evidence tracker. A team member must then rewrite the full entry in their own voice; do not paste this draft as-is.

## Project name

Glyph

[VERIFY: A team member chose and explicitly approved this name; it was not delegated to AI.]

## Tagline

Understand an important AI paper in five minutes—then inspect the evidence behind every material claim.

## Short description

Glyph is a paper-intelligence workspace designed to help investors and technical decision-makers move from a frontier research paper to a clear, evidence-linked explanation and a defensible view of its market implications.

## Inspiration

Important AI papers arrive faster than most people can evaluate them. Summaries are easy to produce, but they often flatten limitations, lose the connection to the source, or jump from a technical result to an unsupported business conclusion. We wanted a reading experience that stays useful without asking the reader to trust a black box.

## What it does

[VERIFY: Replace this section with only the flows that work in the final build.]

Glyph’s intended workflow is:

1. surface a small, explainable set of notable papers;
2. let an editor select one;
3. extract claims, limitations, and contradictions tied to exact PDF passages;
4. explain the paper at progressively deeper levels;
5. connect technical mechanisms to sourced, timestamped market context;
6. require editorial approval before publication;
7. learn from explicit reader feedback without weakening the evidence standard.

## How we built it

Glyph currently combines a dependency-free responsive web prototype with a Node.js/TypeScript backend organized as a pnpm workspace. Fastify exposes the API, Zod and TypeBox enforce contracts, Drizzle supports PostgreSQL persistence, and Vitest plus Node’s test runner exercise the backend and frontend boundaries. [VERIFY: Add final hosting and deployment details.]

We used Codex as an engineering collaborator inside the repository: turning the product brief into acceptance criteria, implementing the eight-view paper experience and evidence-first backend foundations, fixing verification failures, and assembling the submission gates. [VERIFY: A team member must confirm these examples and add the main `/feedback` Session ID.]

The product boundary for GPT-5.6 Terra drafts a structured brief only from evidence spans already selected by the application. Runtime validation rejects unknown citations, supported claims without evidence, and insufficient-evidence claims that still cite support. [VERIFY: Run this boundary on the final paper, record the returned model, and show the validated result before claiming live product use.]

## Challenges

The hard part was not generating fluent text. It was preserving traceability from a readable explanation back to a source passage, while keeping limitations and contradictions visible. [VERIFY: Add one real engineering challenge and how the team resolved it.]

## Accomplishments

[VERIFY: List only working, demonstrated outcomes. Prefer measurable facts: number of routes, papers, evidence links, test cases, or completed workflows.]

## What we learned

[VERIFY: Add a specific team lesson grounded in the implementation. Avoid generic AI claims.]

## What’s next

The roadmap expands from a fixture-backed product slice into governed source ingestion, human-labelled ranking data, stronger claim evaluations, sourced market comparisons, publishing controls, and explainable personalization.

## Built with

Node.js, TypeScript, Fastify, Zod, TypeBox, Drizzle ORM, PostgreSQL, Vitest, Codex, and a tested GPT-5.6 Terra Responses API boundary. [VERIFY: Add final hosting and remove anything not present in the submitted commit.]

## Links

- Demo video: [VERIFY: public or unlisted YouTube URL]
- Code repository: [VERIFY: repository URL and access]
- Live demo: [VERIFY: deployment URL, if supplied]

## Required Codex session

- `/feedback` Session ID: [VERIFY: session ID from Codex Desktop or CLI]

## Final voice check

Read the complete entry aloud. Rewrite sentences you would not naturally say to another builder. Delete adjectives that are not backed by a demo or evidence link. Make sure the finished copy describes the shipped product, not the roadmap.
