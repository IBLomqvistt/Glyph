# Glyph No.1 — Kimi K3 launch analysis

Published at: https://claude.ai/code/artifact/91f3bb31-9e1d-4a06-83ea-7c94c1495762
Updated 21 July 2026. Scheduled update when the K3 weights + technical report land (promised 27 July 2026).

## Files

- **report.html** — the final report, identical to the published artifact. Fully self-contained (styles, diagrams, tab logic, the Glyph it! layer all inline). Open in any browser, host anywhere.
- **source.html** — the editing source. Same file except the twelve concept cards are written as open `<div class="gcard">` blocks, which is easier to edit.
- **build.py** — converts source.html to report.html and runs the validators: card conversion (must be 12/12), HTML tag balance, em/en-dash scan on prose, banned words (PRD, bakes, ablation, rug-pull, milks), and section-anchor consistency (every `#s…` link must have a matching id).

## Edit loop

1. Edit `source.html`.
2. Run `python build.py` and check every validator line is clean.
3. Republish `report.html` (same artifact URL when republished from the original session, or pass the URL to keep it).

## Structure

Three tabs, each with a numbered clickable Contents box:
- ① 5-minute summary: 1.1 definitions, 1.2 one sentence, 1.3 hero diagram, 1.4 five things, 1.5 mechanisms, 1.6 economics, 1.7 watch list
- ② Technical Mechanism: 2.1 concept cards, 2.2 lineage, 2.3 efficiency stack (2.3.1–2.3.6), 2.4 AI that builds AI
- ③ Economics: 3.1 the game (six players), 3.2 demonstrated vs possible, 3.3 cheaper to build not to run, 3.4 distillation, 3.5 four threads, 3.6 sources

Voice rules live in Claude's memory (glyph-report-voice): no idioms, no em dashes, bullets, name actors, explain jargon at first use, an Economics line in every definitional element, two readings on contested numbers.
