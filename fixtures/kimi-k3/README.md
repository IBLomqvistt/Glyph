# Kimi K3 content pack

This directory preserves the user-supplied source material for Glyph's first
real report example.

- `source.html` is the editable report source.
- `build.py` converts the twelve concept cards to closed disclosure elements,
  validates the resulting HTML, and writes `report.html`.
- `report.html` is the reviewed report used by the web reader.
- The corresponding source PDF is copied to
  `apps/web/public/papers/kimi-k3-tech-blog.pdf`.
- `extract_evidence_boxes.py` resolves exact phrases in that PDF to normalized
  page boxes. Its checked values live in `apps/web/src/lib/kimi-reader-content.ts`.
- `apps/web/public/papers/kimi-k3-pages/` contains deterministic 2× PNG renders
  of all 21 PDF pages; the original PDF remains the canonical download asset.

The report remains a provisional launch analysis dated 21 July 2026. Its own
source register distinguishes Moonshot claims, independent measurements, and
Glyph interpretation. Publication still requires human approval.
