import { describe, expect, it } from 'vitest'
import { schemaVersion, type VisualSpec } from '@glyph/domain'
import { renderVisualSpecSvg, validateVisualGraph } from './index'

const spec: VisualSpec = {
  schemaVersion,
  id: 'visual-demo',
  title: 'Baseline and parallel flow',
  purpose: 'Compare a sequential baseline with synthetic parallel work.',
  nodes: [
    { id: 'input', label: 'Task', kind: 'INPUT', value: null, unit: null },
    {
      id: 'split',
      label: 'Decompose',
      kind: 'PROCESS',
      value: null,
      unit: null,
    },
    { id: 'output', label: 'Answer', kind: 'OUTPUT', value: null, unit: null },
  ],
  edges: [
    { id: 'edge-1', from: 'input', to: 'split', label: null, kind: 'FLOW' },
    {
      id: 'edge-2',
      from: 'split',
      to: 'output',
      label: 'aggregate',
      kind: 'FLOW',
    },
  ],
  groups: [],
  claimIds: ['claim-1'],
  evidenceSpanIds: ['evidence-1'],
  layout: 'LEFT_TO_RIGHT',
}

describe('deterministic visual rendering', () => {
  it('renders the same accessible SVG for the same spec', () => {
    const first = renderVisualSpecSvg(spec)
    const second = renderVisualSpecSvg(spec)
    expect(first).toBe(second)
    expect(first).toContain('role="img"')
    expect(first).toContain('Baseline and parallel flow')
    expect(first).toContain('data-node-id="split"')
  })

  it('rejects edges connected to unknown nodes', () => {
    const invalid: VisualSpec = {
      ...spec,
      edges: [
        { id: 'bad', from: 'missing', to: 'output', label: null, kind: 'FLOW' },
      ],
    }
    expect(validateVisualGraph(invalid)).toEqual([
      expect.objectContaining({ code: 'UNKNOWN_EDGE_NODE' }),
    ])
    expect(() => renderVisualSpecSvg(invalid)).toThrow('unknown node')
  })
})
