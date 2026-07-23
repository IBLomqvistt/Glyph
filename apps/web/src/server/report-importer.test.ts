import { describe, expect, it } from 'vitest'
import { kimiEvidenceSpans, kimiPaperVersion } from '../lib/report-catalog'
import { importClaudeHtml } from './report-importer'

const validHtml = `<!doctype html>
<html><head><title>Second Kimi analysis</title><style>.box{fill:#fff;stroke:#222}</style></head><body>
<h1>Second Kimi analysis</h1><p class="kicker">A validated package test.</p>
<section data-glyph-tab="summary" data-glyph-section="summary-core">
  <p data-glyph-claim="claim-scale" data-glyph-claim-classification="AUTHOR_CLAIM" data-glyph-evidence-ids="evidence-model-scale">K3 is a 2.8T parameter model.</p>
  <figure data-glyph-visual="visual-scale" data-glyph-evidence-ids="evidence-model-scale"><svg viewBox="0 0 100 40" aria-label="Scale"><rect class="box" x="1" y="2" width="90" height="30"></rect><text x="10" y="20">2.8T</text></svg><figcaption>Scale disclosed by Moonshot.</figcaption></figure>
</section>
<section data-glyph-tab="mechanism" data-glyph-section="mechanism-core"><h2>Mechanism</h2><table data-glyph-visual="table-mechanism"><tbody><tr><td>KDA</td></tr></tbody></table></section>
<section data-glyph-tab="economics" data-glyph-section="economics-core"><h2>Economics</h2><p>No direct trade implication.</p></section>
<a data-glyph-source="source-kimi" href="https://www.kimi.com/blog/kimi-k3">Kimi K3 launch post</a>
</body></html>`

describe('Claude HTML report importer', () => {
  it('imports marked HTML and preserves inline SVG geometry, styling, and labels', () => {
    const imported = importClaudeHtml({
      html: validHtml,
      originalFileName: 'second-report.html',
      paperVersion: kimiPaperVersion,
      evidenceSpans: kimiEvidenceSpans,
      now: new Date('2026-07-22T12:00:00.000Z'),
    })

    expect(imported.reportPackage.status).toBe('DRAFT')
    expect(imported.reportPackage.tabs.map((tab) => tab.id)).toEqual([
      'summary',
      'mechanism',
      'economics',
    ])
    expect(imported.reportPackage.evidenceReferences).toHaveLength(1)
    expect(imported.extractedAssetSummary).toEqual({
      inlineSvgCount: 1,
      tableCount: 1,
      unresolvedExternalAssetCount: 0,
    })
    const visual = imported.reportPackage.visuals.find(
      (item) => item.id === 'visual-scale',
    )
    expect(visual?.html).toContain('viewBox="0 0 100 40"')
    expect(visual?.html).toContain('class="box"')
    expect(visual?.html).toContain('x="1" y="2" width="90" height="30"')
    expect(visual?.html).toContain('>2.8T</text>')
  })

  it('recovers legacy tabs but blocks approval until markers are added', () => {
    const legacy = validHtml
      .replaceAll(' data-glyph-tab="summary"', ' id="pane-summary"')
      .replaceAll(' data-glyph-tab="mechanism"', ' id="pane-mechanisms"')
      .replaceAll(' data-glyph-tab="economics"', ' id="pane-economics"')
      .replaceAll(/ data-glyph-section="[^"]+"/gu, '')
    const imported = importClaudeHtml({
      html: legacy,
      originalFileName: 'legacy.html',
      paperVersion: kimiPaperVersion,
      evidenceSpans: kimiEvidenceSpans,
    })
    expect(imported.reportPackage.status).toBe('BLOCKED')
    expect(imported.reportPackage.diagnostics.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        'LEGACY_HTML_REQUIRES_MARKERS',
        'MISSING_SECTION_MARKERS',
      ]),
    )
  })

  it('assigns nested claims and visuals only to their nearest marked section', () => {
    const nested = validHtml.replace(
      '</section>\n<section data-glyph-tab="mechanism"',
      '<section data-glyph-section="summary-detail"><p data-glyph-claim="claim-routing" data-glyph-claim-classification="AUTHOR_CLAIM" data-glyph-evidence-ids="evidence-routing">K3 activates 16 of 896 experts.</p><figure data-glyph-visual="visual-routing"><svg viewBox="0 0 40 20"><rect width="20" height="10"></rect></svg></figure></section></section>\n<section data-glyph-tab="mechanism"',
    )
    const imported = importClaudeHtml({
      html: nested,
      originalFileName: 'nested.html',
      paperVersion: kimiPaperVersion,
      evidenceSpans: kimiEvidenceSpans,
    })
    const root = imported.reportPackage.sections.find(
      (section) => section.id === 'summary-core',
    )
    const detail = imported.reportPackage.sections.find(
      (section) => section.id === 'summary-detail',
    )
    expect(root?.claimIds).toEqual(['claim-scale'])
    expect(root?.visualIds).toEqual(['visual-scale'])
    expect(detail?.claimIds).toEqual(['claim-routing'])
    expect(detail?.visualIds).toEqual(['visual-routing'])
  })

  it('blocks duplicate marked record IDs without throwing away the preview', () => {
    const duplicate = validHtml.replace(
      '<h2>Economics</h2>',
      '<p data-glyph-claim="claim-scale" data-glyph-claim-classification="AUTHOR_CLAIM" data-glyph-evidence-ids="evidence-model-scale">Duplicate marker.</p><h2>Economics</h2>',
    )
    const imported = importClaudeHtml({
      html: duplicate,
      originalFileName: 'duplicate-markers.html',
      paperVersion: kimiPaperVersion,
      evidenceSpans: kimiEvidenceSpans,
    })
    expect(imported.reportPackage.status).toBe('BLOCKED')
    expect(imported.reportPackage.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'DUPLICATE_CLAIM_ID' }),
      ]),
    )
    expect(imported.reportPackage.claims).toHaveLength(1)
  })

  it.each([
    {
      name: 'duplicate IDs',
      html: validHtml.replace(
        '<h2>Economics</h2>',
        '<h2 id="repeat">Economics</h2><p id="repeat">Duplicate</p>',
      ),
      code: 'DUPLICATE_ID',
    },
    {
      name: 'unknown evidence',
      html: validHtml.replace('evidence-model-scale', 'evidence-unknown'),
      code: 'UNKNOWN_EVIDENCE',
    },
    {
      name: 'unsafe script',
      html: validHtml.replace('</body>', '<script>alert(1)</script></body>'),
      code: 'UNSAFE_SCRIPT',
    },
    {
      name: 'event handlers',
      html: validHtml.replace('<svg ', '<svg onload="alert(1)" '),
      code: 'EXECUTABLE_ATTRIBUTE',
    },
    {
      name: 'unsafe CSS',
      html: validHtml.replace(
        '.box{fill:#fff;stroke:#222}',
        '.box{background:url(https://bad.example/a)}',
      ),
      code: 'UNSAFE_CSS',
    },
    {
      name: 'foreignObject',
      html: validHtml.replace(
        '</svg>',
        '<foreignObject></foreignObject></svg>',
      ),
      code: 'UNSAFE_EMBED',
    },
    {
      name: 'missing viewBox',
      html: validHtml.replace(' viewBox="0 0 100 40"', ''),
      code: 'SVG_VIEWBOX_REQUIRED',
    },
    {
      name: 'unbounded viewBox',
      html: validHtml.replace('viewBox="0 0 100 40"', 'viewBox="0 0 20000 40"'),
      code: 'SVG_VIEWBOX_INVALID',
    },
  ])('blocks $name', ({ html, code }) => {
    const imported = importClaudeHtml({
      html,
      originalFileName: 'unsafe.html',
      paperVersion: kimiPaperVersion,
      evidenceSpans: kimiEvidenceSpans,
    })
    expect(imported.reportPackage.status).toBe('BLOCKED')
    expect(imported.reportPackage.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code })]),
    )
  })

  it('treats malformed HTML as a blocked structural import', () => {
    const imported = importClaudeHtml({
      html: '<html><body><section data-glyph-tab="summary"><svg></body>',
      originalFileName: 'malformed.html',
      paperVersion: kimiPaperVersion,
      evidenceSpans: kimiEvidenceSpans,
    })
    expect(imported.reportPackage.status).toBe('BLOCKED')
    expect(imported.reportPackage.diagnostics.length).toBeGreaterThan(0)
  })
})
