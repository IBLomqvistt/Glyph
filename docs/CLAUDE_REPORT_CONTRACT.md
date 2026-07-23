# Claude HTML report contract

Glyph imports one UTF-8 HTML file of at most 10 MB. Claude remains responsible
for the report prose, tables, and inline SVG diagrams. Glyph validates,
sanitizes, packages, previews, and publishes the result.

## Required structure

Each report must contain exactly one root for each tab:

```html
<section data-glyph-tab="summary" data-glyph-section="summary-core">
  <!-- summary content -->
</section>
<section data-glyph-tab="mechanism" data-glyph-section="mechanism-core">
  <!-- technical mechanisms -->
</section>
<section data-glyph-tab="economics" data-glyph-section="economics-core">
  <!-- conditional economic relevance -->
</section>
```

Every section ID must be stable between revisions. Additional marked sections
may sit inside a tab root, but section roots must not overlap.

## Claims and evidence

Material claims use stable IDs, a classification, and validated evidence IDs:

```html
<p
  data-glyph-claim="claim-routing-scale"
  data-glyph-claim-classification="AUTHOR_CLAIM"
  data-glyph-evidence-ids="evidence-routing"
  data-glyph-material="true"
>
  Moonshot says K3 activates 16 of 896 experts.
</p>
```

Allowed classifications are:

- `AUTHOR_CLAIM`
- `INDEPENDENT_EVIDENCE`
- `GLYPH_INTERPRETATION`
- `INSUFFICIENT_EVIDENCE`

Evidence IDs must already exist for the selected `PaperVersion`. The importer
checks the paper version, page number, and exact source text. Missing or
mismatched evidence blocks approval. Glyph never invents a fallback mapping.

## Concepts, sources, and visuals

```html
<details
  data-glyph-concept="concept-kda"
  data-glyph-concept-name="Kimi Delta Attention"
>
  <summary>Kimi Delta Attention (KDA)</summary>
  <p>A fixed-state attention mechanism disclosed by Moonshot.</p>
</details>

<figure
  data-glyph-visual="visual-kda-memory"
  data-glyph-evidence-ids="evidence-kda-attnres"
>
  <svg viewBox="0 0 920 360" role="img" aria-label="KDA memory update">
    <!-- Claude-authored geometry, labels, and styles -->
  </svg>
  <figcaption>KDA updates a fixed-size state.</figcaption>
</figure>

<a
  data-glyph-source="source-kimi-launch"
  href="https://www.kimi.com/blog/kimi-k3"
  >Kimi K3 launch post</a
>
```

Tables should be ordinary semantic HTML tables. Every figure and table needs a
stable `data-glyph-visual` ID. SVGs require a finite `viewBox`.

## Security and portability rules

The importer removes scripts and executable attributes. It blocks approval for:

- scripts, embeds, forms, frames, audio, or video;
- event handlers such as `onclick` or `onload`;
- external stylesheets, CSS imports, CSS URLs, expressions, or bindings;
- SVG `foreignObject`, animation, scripts, external references, or a missing or
  unbounded `viewBox`;
- external image and font assets. These are recorded as unresolved and are not
  fetched automatically;
- duplicate or malformed IDs;
- missing tab, section, claim, visual, or evidence markers.

Inline CSS, inline SVG geometry, SVG labels, and HTML tables are preserved after
validation. The renderer adds only responsive containment. It does not redraw
Claude's diagrams.

## Legacy HTML

Glyph can identify legacy `#pane-summary`, `#pane-mechanisms`, and
`#pane-economics` roots for preview. Legacy imports remain blocked until the
required markers and evidence references are supplied and a human editor
approves the draft.
