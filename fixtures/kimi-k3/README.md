# Kimi K3 evidence tooling

This directory retains the deterministic utility used to locate exact evidence
passages in the Kimi K3 source PDF.

- `extract_evidence_boxes.py` resolves exact phrases in that PDF to normalized
  page boxes. Its reviewed values live in
  `apps/web/src/lib/report-catalog.ts`.
- The canonical source PDF is
  `apps/web/public/papers/kimi-k3-tech-blog.pdf`.
- `apps/web/public/papers/kimi-k3-pages/` contains deterministic 2x PNG renders
  of all 21 PDF pages.
- The reviewed Claude HTML source is imported through the same structural
  pipeline as future reports. It is not a second reader implementation.

The report remains a provisional launch analysis dated 21 July 2026. The
approved package distinguishes author claims, independent evidence, Glyph
interpretation, and insufficient evidence.
