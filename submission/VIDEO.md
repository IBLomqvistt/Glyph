# Video and YouTube runbook

## Before recording

- Freeze the demo build and seed deterministic demo data.
- Restart from a clean state and rehearse every click in `DEMO_SCRIPT.md`.
- Close notifications and unrelated tabs; remove tokens, emails, private PDFs, and local paths from view.
- Set the recording canvas to 1920×1080 or 1280×720, with readable browser zoom.
- Test the microphone for clear voice, low room noise, and no clipping.
- Start a timer. The final video must stay under three minutes.
- AI-generated narration is permitted under the supplied event guidance, but every spoken claim must remain accurate and natural.

## Capture and edit

- Record the full flow twice, including voiceover.
- Cut dead time, loading waits, mistakes, and repeated explanations.
- Add only minimal labels where a judge might miss an interaction.
- Confirm the narration explicitly covers what Codex did and where GPT-5.6 was used.
- Export H.264 MP4 at 1080p or 720p with AAC audio.

## Quality-control watch

- Watch the actual rendered file, not only the editor timeline.
- Confirm first-frame clarity, readable text, smooth playback, and clear audio.
- Confirm no credential, personal, private-repository, or licensed-document information is visible.
- Confirm every feature claimed in the voiceover visibly works.
- Confirm the duration is below 3:00.

## YouTube

Suggested title: `Glyph — OpenAI Build Week Demo`

Suggested description:

> Glyph turns frontier AI papers into progressive, evidence-linked explanations and defensible market context. This demo shows [FINAL: shipped flows] and explains how Codex and GPT-5.6 were used to build and verify the experience.
>
> Built for OpenAI Build Week.

Upload settings:

- Visibility: **Public** or **Unlisted**; never Private.
- Audience: set accurately; do not mark as made for kids unless it is.
- Wait for HD processing, then open the link in a signed-out/incognito window.
- Play the first and last 15 seconds and confirm audio, resolution, and access.
- Paste the canonical `youtube.com/watch` link into `EVIDENCE.md` and Devpost.

Do not postpone rendering or upload until the final ten minutes. Encoding, HD processing, and link checks take time.
