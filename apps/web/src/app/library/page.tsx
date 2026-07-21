import Link from 'next/link'
import { Bookmark, FileText, Radar } from 'lucide-react'
import { Badge, Card } from '@glyph/ui'
import { LibraryConceptCard } from '@/components/library-concept-card'
import { CookieConceptRepository } from '@/server/concepts'
import { edition } from '@/lib/edition'

export const dynamic = 'force-dynamic'

type LibraryTab = 'concepts' | 'reports' | 'monitoring'

const tabs: ReadonlyArray<{
  id: LibraryTab
  label: string
  icon: typeof Bookmark
}> = [
  { id: 'concepts', label: 'Concepts', icon: Bookmark },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'monitoring', label: 'Monitoring', icon: Radar },
]

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}): Promise<React.JSX.Element> {
  const [saved, query] = await Promise.all([
    new CookieConceptRepository().listSaved(),
    searchParams,
  ])
  const requestedTab = typeof query.tab === 'string' ? query.tab : 'concepts'
  const activeTab: LibraryTab = tabs.some((tab) => tab.id === requestedTab)
    ? (requestedTab as LibraryTab)
    : 'concepts'

  return (
    <div className="page page-wide library-page">
      <header className="page-header library-header">
        <div>
          <span className="eyebrow">My Glyph</span>
          <h1>Library</h1>
          <p>Your saved concepts, reports, and monitoring—not a public feed.</p>
        </div>
      </header>
      <nav className="library-tabs" aria-label="Library sections">
        {tabs.map(({ id, label, icon: Icon }) => (
          <Link
            key={id}
            href={`/library?tab=${id}`}
            className={activeTab === id ? 'active' : undefined}
            aria-current={activeTab === id ? 'page' : undefined}
          >
            <Icon aria-hidden="true" /> {label}{' '}
            <Badge tone={id === 'concepts' ? 'violet' : 'neutral'}>
              {id === 'concepts' ? saved.length : id === 'reports' ? 1 : 0}
            </Badge>
          </Link>
        ))}
      </nav>

      {activeTab === 'concepts' ? (
        <section aria-labelledby="concepts-title">
          <h2 id="concepts-title" className="sr-only">
            Saved concepts
          </h2>
          {saved.length === 0 ? (
            <Card className="empty-state">
              <Bookmark aria-hidden="true" size={28} />
              <h3>No saved concepts yet</h3>
              <p>Save concepts from a report to build your personal library.</p>
              <Link
                href={`/reader/${edition.report.slug}`}
                className="button button-primary button-default"
              >
                Open the reader
              </Link>
            </Card>
          ) : (
            <div className="concept-grid">
              {saved.map((concept) => (
                <LibraryConceptCard
                  key={concept.id}
                  concept={concept}
                  visual={edition.visuals.find(
                    (candidate) => candidate.id === concept.visualSpecId,
                  )}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {activeTab === 'reports' ? (
        <section aria-labelledby="reports-title">
          <h2 id="reports-title">Saved reports</h2>
          <Link href={`/reader/${edition.report.slug}`}>
            <Card className="saved-report-card">
              <span className="eyebrow">Synthetic edition</span>
              <h3>{edition.paper.title}</h3>
              <p>{edition.paper.selectionRationale}</p>
              <span className="concept-open-label">Open report</span>
            </Card>
          </Link>
        </section>
      ) : null}

      {activeTab === 'monitoring' ? (
        <section aria-labelledby="monitoring-title">
          <h2 id="monitoring-title">Monitoring</h2>
          <Card className="empty-state">
            <Radar aria-hidden="true" size={28} />
            <h3>No monitoring items</h3>
            <p>
              This local edition does not invent live market signals. No direct
              trade implication remains a valid conclusion.
            </p>
          </Card>
        </section>
      ) : null}
    </div>
  )
}
