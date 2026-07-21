import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { schemaVersion, type VisualSpec } from '@glyph/domain'
import { Diagram } from './diagram'
import { normalizedBoxStyle } from './pdf-page'

describe('critical presentation components', () => {
  it('renders deterministic diagram semantics and a text alternative', () => {
    const spec: VisualSpec = {
      schemaVersion,
      id: 'visual-test',
      title: 'Input to output',
      purpose: 'Explain a synthetic flow.',
      nodes: [
        { id: 'input', label: 'Input', kind: 'INPUT', value: null, unit: null },
        {
          id: 'output',
          label: 'Output',
          kind: 'OUTPUT',
          value: null,
          unit: null,
        },
      ],
      edges: [
        {
          id: 'flow',
          from: 'input',
          to: 'output',
          label: 'becomes',
          kind: 'FLOW',
        },
      ],
      groups: [],
      claimIds: [],
      evidenceSpanIds: [],
      layout: 'LEFT_TO_RIGHT',
    }
    const markup = renderToStaticMarkup(<Diagram spec={spec} />)
    expect(markup).toContain(
      '<title id="title-visual-test">Input to output</title>',
    )
    expect(markup).toContain('Input to output.')
    expect(markup).toContain('input to output (becomes)')
  })

  it('keeps normalized highlight geometry independent of PDF zoom', () => {
    const box = { x: 0.1, y: 0.2, width: 0.3, height: 0.4 }
    expect(normalizedBoxStyle(box)).toEqual({
      left: '10%',
      top: '20%',
      width: '30%',
      height: '40%',
    })
  })
})
