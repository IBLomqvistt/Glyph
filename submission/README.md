# Glyph submission command center

This directory is the single source of truth for the OpenAI Build Week submission. It is intentionally marked incomplete while Glyph still uses synthetic research content and lacks final submission evidence.

## Deadline and current gap

- Hard deadline: **Tuesday, July 21, 2026 at 5:00 PM PT**.
- The organizer note saying “4 days away” was a relative countdown when that note was published. It is not the live countdown; the timestamp above governs.
- Expected halfway state: rough core functionality, an active main Codex build session with a known `/feedback` Session ID, a demo concept, and a configured repository.
- Actual Glyph state on July 21: planning/submission documents only, no runnable core, no commit, no remote, and no build-session ID. Treat implementation, repository setup, and the main build session as critical-path work.

## Package

| Artifact | Purpose | Current state |
|---|---|---|
| [`DEVPOST.md`](DEVPOST.md) | Paste-ready project copy | Draft; claims must be reconciled with the final build |
| [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) | 2:45 recording storyboard and voiceover | Draft; replace screen placeholders |
| [`VIDEO.md`](VIDEO.md) | Capture, render, YouTube, and link workflow | Ready to use |
| [`REPO_ACCESS.md`](REPO_ACCESS.md) | Private-repo sharing and verification | Blocked: no Git remote exists |
| [`EVIDENCE.md`](EVIDENCE.md) | Links and proof for every submission claim | Empty tracker |
| [`FINAL_CHECKLIST.md`](FINAL_CHECKLIST.md) | Hard go/no-go gates | Open |
| [`../scripts/submission-audit.sh`](../scripts/submission-audit.sh) | Local preflight audit | Ready; expected to fail until gates close |

## Finish-line order

1. Start the Devpost entry immediately as a draft and add teammates now; they must accept before the deadline.
2. Establish the main Codex build session, use Codex throughout implementation, and commit working increments often.
3. Freeze a working build and document exact setup/test commands in the root README.
4. Test a clean clone with fresh credentials and capture the result in `EVIDENCE.md`.
5. Record the scripted demo with clear voiceover; keep the final cut under three minutes.
6. Render immediately, watch the exported file end to end, then upload to YouTube as Public or Unlisted.
7. Confirm repository visibility. If private, grant access to both required Devpost/OpenAI addresses and verify the invitations.
8. Run `/feedback` from the main build thread in an official Codex Desktop or CLI session opened on this codebase; add that session ID.
9. Reconcile every Devpost sentence with the shipped build. Read it aloud and rewrite anything vague, inflated, or unnatural.
10. Run `./scripts/submission-audit.sh` and resolve every failure.
11. Submit through Devpost, then open My Projects and confirm the entry is green and marked **Submitted**, not Draft.

Submission management page: https://devpost.com/submit-to/30223-openai-build-week/manage/submissions

The submission locks at **5:00 PM PT**. Treat the video upload and Devpost confirmation as an earlier internal deadline; do not begin rendering at 4:50 PM.

## Free-tier build strategy

- A paid plan is not required under the supplied event guidance. GPT-5.6 Terra is available to free Codex users, and only part of the project needs to use GPT-5.6.
- Reserve GPT-5.6 for the work where it adds the clearest value and be specific about that work in the README and video.
- Batch focused Codex tasks instead of leaving sessions idle.
- Commit small working increments so a rate-limit reset does not erase context or progress.
- Keep the main build thread identifiable; the required `/feedback` ID must come from that thread, not a submission-copy-only session.

## Human ownership gates

- A team member must understand and be able to explain every submitted code path.
- A team member must rewrite the final description in their own voice; the copy deck is scaffolding, not final prose.
- The team—not an AI tool—owns and approves the project name.
- AI-generated voiceover is allowed, but it must accurately describe the working product and concrete Codex/GPT-5.6 use.
