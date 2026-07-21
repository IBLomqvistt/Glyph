import Link from 'next/link'
import { ArrowLeft, Bookmark } from 'lucide-react'
import { notFound } from 'next/navigation'
import { Button, Card } from '@glyph/ui'
import { Diagram } from '@/components/diagram'
import { edition } from '@/lib/edition'
import { toggleConcept } from '@/server/concept-actions'

export function generateStaticParams(): Array<{ id: string }> {
  return edition.concepts.map((concept) => ({ id: concept.id }))
}

export default async function ConceptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<React.JSX.Element> {
  const { id } = await params
  const concept = edition.concepts.find((candidate) => candidate.id === id)
  if (!concept) notFound()
  const visual = edition.visuals.find(
    (candidate) => candidate.id === concept.visualSpecId,
  )
  const related = concept.relatedConceptIds
    .map((relatedId) =>
      edition.concepts.find((candidate) => candidate.id === relatedId),
    )
    .filter((candidate) => candidate !== undefined)

  return (
    <div className="page concept-detail-page">
      <Link href="/library?tab=concepts" className="text-link">
        <ArrowLeft aria-hidden="true" size={15} /> Back to library
      </Link>
      <header>
        <span className="eyebrow">Saved concept</span>
        <h1>{concept.name}</h1>
        <p>{concept.shortDefinition}</p>
      </header>
      <div className="concept-detail-grid">
        <Card>
          <h2>In this report</h2>
          <p>{concept.contextualExplanation}</p>
          <h2>Why it matters</h2>
          <p>{concept.relevance}</p>
          {concept.analogy ? (
            <p className="analogy">{concept.analogy}</p>
          ) : null}
          <form action={toggleConcept}>
            <input type="hidden" name="conceptId" value={concept.id} />
            <input type="hidden" name="intent" value="unsave" />
            <Button type="submit" variant="secondary">
              <Bookmark aria-hidden="true" size={16} /> Remove from library
            </Button>
          </form>
        </Card>
        <Card className="concept-detail-visual">
          {visual ? (
            <Diagram spec={visual} />
          ) : (
            <div className="concept-geometry large" aria-hidden="true">
              <span />
              <span />
              <span />
              <i />
            </div>
          )}
        </Card>
      </div>
      {related.length > 0 ? (
        <section className="related-concepts">
          <h2>Related concepts</h2>
          <div className="chip-row">
            {related.map((candidate) => (
              <Link
                className="chip"
                key={candidate.id}
                href={`/library/concepts/${candidate.id}`}
              >
                {candidate.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
