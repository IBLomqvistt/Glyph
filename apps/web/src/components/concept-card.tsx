'use client'

import Link from 'next/link'
import { Bookmark, ExternalLink } from 'lucide-react'
import {
  Button,
  PopoverContent,
  PopoverRoot,
  PopoverTrigger,
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@glyph/ui'
import type { ConceptCard as Concept, VisualSpec } from '@glyph/domain'
import { toggleConcept } from '@/server/concept-actions'
import { Diagram } from './diagram'

type ConceptCardProps = {
  concept: Concept
  allConcepts: readonly Concept[]
  visuals: readonly VisualSpec[]
  saved?: boolean
}

export function ConceptCard(props: ConceptCardProps): React.JSX.Element {
  const trigger = (
    <button className="concept-term" type="button">
      {props.concept.name}
    </button>
  )

  return (
    <>
      <span className="desktop-concept-card">
        <PopoverRoot>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent
            title={props.concept.name}
            className="concept-popover"
          >
            <ConceptDetail {...props} />
          </PopoverContent>
        </PopoverRoot>
      </span>
      <span className="mobile-concept-card">
        <Sheet>
          <SheetTrigger asChild>{trigger}</SheetTrigger>
          <SheetContent
            title={props.concept.name}
            description="Contextual teaching card scoped to this synthetic report"
            className="concept-sheet"
          >
            <ConceptDetail {...props} />
          </SheetContent>
        </Sheet>
      </span>
    </>
  )
}

function ConceptDetail({
  concept,
  allConcepts,
  visuals,
  saved = false,
}: ConceptCardProps): React.JSX.Element {
  const visual = visuals.find(
    (candidate) => candidate.id === concept.visualSpecId,
  )
  const related = concept.relatedConceptIds
    .map((id) => allConcepts.find((candidate) => candidate.id === id))
    .filter((candidate): candidate is Concept => candidate !== undefined)

  return (
    <div className="concept-detail">
      <span className="eyebrow">Core concept</span>
      <p className="concept-definition">{concept.shortDefinition}</p>
      <div className="soft-panel">
        <h3>In this report</h3>
        <p>{concept.contextualExplanation}</p>
      </div>
      <h3>Why it matters</h3>
      <p>{concept.relevance}</p>
      {concept.analogy ? (
        <p className="analogy">Analogy: {concept.analogy}</p>
      ) : null}
      {visual ? <Diagram spec={visual} /> : null}
      {related.length > 0 ? (
        <div>
          <h3>Related concepts</h3>
          <div className="chip-row">
            {related.map((candidate) => (
              <span className="chip" key={candidate.id}>
                {candidate.name}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      <form action={toggleConcept}>
        <input type="hidden" name="conceptId" value={concept.id} />
        <input type="hidden" name="intent" value={saved ? 'unsave' : 'save'} />
        <Button type="submit" variant={saved ? 'secondary' : 'primary'}>
          <Bookmark aria-hidden="true" size={16} />
          {saved ? 'Remove from library' : 'Save concept'}
        </Button>
      </form>
      <Link className="text-link" href={`/library/concepts/${concept.id}`}>
        Learn deeper in Glyph <ExternalLink aria-hidden="true" size={14} />
      </Link>
    </div>
  )
}
