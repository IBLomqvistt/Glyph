import Link from 'next/link'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { Button, Card } from '@glyph/ui'
import type { ConceptCard as Concept, VisualSpec } from '@glyph/domain'
import { toggleConcept } from '@/server/concept-actions'
import { Diagram } from './diagram'

export function LibraryConceptCard({
  concept,
  visual,
}: {
  concept: Concept
  visual: VisualSpec | undefined
}): React.JSX.Element {
  return (
    <Card className="library-concept-card" id={concept.id}>
      <details className="concept-menu">
        <summary aria-label={`Actions for ${concept.name}`}>
          <MoreHorizontal aria-hidden="true" size={20} />
        </summary>
        <div>
          <form action={toggleConcept}>
            <input type="hidden" name="conceptId" value={concept.id} />
            <input type="hidden" name="intent" value="unsave" />
            <Button type="submit" variant="ghost" size="small">
              <Trash2 aria-hidden="true" size={15} /> Remove
            </Button>
          </form>
        </div>
      </details>
      <Link
        href={`/library/concepts/${concept.id}`}
        className="concept-card-link"
      >
        <h3>{concept.name}</h3>
        <p>{concept.shortDefinition}</p>
        <div className="library-concept-visual">
          {visual ? (
            <Diagram spec={visual} />
          ) : (
            <div className="concept-geometry" aria-hidden="true">
              <span />
              <span />
              <span />
              <i />
            </div>
          )}
        </div>
        <span className="concept-open-label">Open concept</span>
      </Link>
    </Card>
  )
}
