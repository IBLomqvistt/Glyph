import type { VisualSpec } from '@glyph/domain'

export type VisualGraphIssue = {
  code: 'UNKNOWN_EDGE_NODE' | 'UNKNOWN_GROUP_NODE'
  message: string
}

export function validateVisualGraph(spec: VisualSpec): VisualGraphIssue[] {
  const nodeIds = new Set(spec.nodes.map((node) => node.id))
  const issues: VisualGraphIssue[] = []

  for (const edge of spec.edges) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      issues.push({
        code: 'UNKNOWN_EDGE_NODE',
        message: `Edge ${edge.id} references an unknown node`,
      })
    }
  }
  for (const group of spec.groups) {
    for (const nodeId of group.nodeIds) {
      if (!nodeIds.has(nodeId)) {
        issues.push({
          code: 'UNKNOWN_GROUP_NODE',
          message: `Group ${group.id} references unknown node ${nodeId}`,
        })
      }
    }
  }
  return issues
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export function renderVisualSpecSvg(spec: VisualSpec): string {
  const issues = validateVisualGraph(spec)
  if (issues.length > 0) {
    throw new Error(issues.map((issue) => issue.message).join('; '))
  }

  const width = 920
  const height = Math.max(320, 160 + Math.ceil(spec.nodes.length / 4) * 150)
  const positions = new Map(
    spec.nodes.map((node, index) => {
      const column = index % 4
      const row = Math.floor(index / 4)
      return [node.id, { x: 90 + column * 220, y: 130 + row * 150 }] as const
    }),
  )
  const markerId = `arrow-${spec.id.replaceAll(/[^a-zA-Z0-9_-]/g, '-')}`

  const edges = spec.edges
    .map((edge) => {
      const from = positions.get(edge.from)
      const to = positions.get(edge.to)
      if (from === undefined || to === undefined) return ''
      const label =
        edge.label === null
          ? ''
          : `<text x="${(from.x + to.x) / 2}" y="${(from.y + to.y) / 2 - 8}" text-anchor="middle" class="edge-label">${escapeXml(edge.label)}</text>`
      return `<g data-edge-id="${escapeXml(edge.id)}"><path d="M ${from.x + 68} ${from.y} L ${to.x - 68} ${to.y}" class="edge edge-${edge.kind.toLowerCase()}" marker-end="url(#${markerId})"/>${label}</g>`
    })
    .join('')

  const nodes = spec.nodes
    .map((node) => {
      const position = positions.get(node.id)
      if (position === undefined) return ''
      const metric =
        node.value === null
          ? ''
          : `<text x="${position.x}" y="${position.y + 25}" text-anchor="middle" class="metric">${node.value}${node.unit === null ? '' : ` ${escapeXml(node.unit)}`}</text>`
      return `<g data-node-id="${escapeXml(node.id)}" class="node node-${node.kind.toLowerCase()}"><rect x="${position.x - 68}" y="${position.y - 36}" width="136" height="72" rx="16"/><text x="${position.x}" y="${position.y + (node.value === null ? 5 : -5)}" text-anchor="middle">${escapeXml(node.label)}</text>${metric}</g>`
    })
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title-${escapeXml(spec.id)} desc-${escapeXml(spec.id)}" viewBox="0 0 ${width} ${height}"><title id="title-${escapeXml(spec.id)}">${escapeXml(spec.title)}</title><desc id="desc-${escapeXml(spec.id)}">${escapeXml(spec.purpose)}</desc><defs><marker id="${markerId}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/></marker><style>.node rect{fill:#fff;stroke:#a9a5ff;stroke-width:2}.node text{font:600 15px ui-sans-serif,system-ui;fill:#151b43}.metric{font:500 12px ui-monospace,monospace!important;fill:#5e63a6!important}.edge{fill:none;stroke:#7468ef;stroke-width:2;color:#7468ef}.edge-discard{stroke-dasharray:6 6}.edge-label{font:500 12px ui-sans-serif,system-ui;fill:#5e63a6}</style></defs><text x="48" y="54" class="diagram-title">${escapeXml(spec.title)}</text>${edges}${nodes}</svg>`
}
