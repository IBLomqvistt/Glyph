# Glyph Task Template

Use this template for meaningful product or engineering work. Keep it concise
and link to durable context rather than pasting whole documents.

## Goal

State the observable outcome in one or two sentences.

## Context

Read the nearest `AGENTS.md` files and list only the relevant sources, for
example:

- `docs/PRD.md`, with the relevant section named.
- `docs/ARCHITECTURE.md`, with the relevant boundary named.
- Existing implementation paths and prior-art examples.
- Fixtures, diagrams, screenshots, or external specifications supplied for the
  task.

Describe the current behavior and why the change is needed.

## Constraints

List task-specific constraints that are not already clear from the repository
instructions. Include affected product invariants, compatibility requirements,
explicit non-goals, and changes that require approval.

Do not repeat the entire PRD or `AGENTS.md`.

## Done when

Use observable acceptance criteria. Cover:

- The expected user or system behavior.
- Loading, empty, error, permission, and insufficient-evidence states that are
  relevant to the task.
- Responsive and accessibility behavior for UI work.
- Evidence, claim-type, data-quality, publication, or idempotency rules that are
  relevant to the task.
- Required tests, evals, browser flows, and verification commands.

## Execution

State whether the work requires a plan. A plan is required for cross-module
work or changes involving data models, migrations, AI prompts or schemas, PDF
evidence mapping, analytical diagrams, authentication, billing, publication,
security, or provider selection.

If a plan is required:

1. Inspect the implementation and prior art.
2. Identify interfaces, data flow, failure modes, and verification.
3. Implement the complete approved plan.
4. Do not stop after producing the plan unless the user requested planning only.

For a small isolated edit, say why direct implementation is safe.

## Verification

Before finishing:

1. Run the smallest relevant checks during implementation.
2. Run every repository check affected by the final change.
3. Exercise the user-visible or operational behavior.
4. Review the final diff against the task, PRD, architecture, and review guide.
5. Repair in-scope issues.
6. Report checks that passed and anything that could not be verified.

Never mark a task complete based only on compilation or a plausible visual
inspection.
