import { renderVisualSpecSvg } from '@glyph/diagrams'
import type { VisualSpec } from '@glyph/domain'

export function Diagram({ spec }: { spec: VisualSpec }): React.JSX.Element {
  const svg = renderVisualSpecSvg(spec)
  return (
    <figure className="diagram" data-testid={`diagram-${spec.id}`}>
      <div aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />
      <figcaption>
        <strong>{spec.title}.</strong> {spec.purpose}
        <span className="text-alternative">
          Nodes: {spec.nodes.map((node) => node.label).join('; ')}. Connections:{' '}
          {spec.edges
            .map(
              (edge) =>
                `${edge.from} to ${edge.to}${edge.label ? ` (${edge.label})` : ''}`,
            )
            .join('; ')}
          .
        </span>
      </figcaption>
    </figure>
  )
}
