'use client'

import { useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Expand,
  FileText,
  List,
  Minus,
  Plus,
  Quote,
  Target,
  Zap,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  Sheet,
  SheetContent,
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
} from '@glyph/ui'
import {
  kimiArchitectureVisual,
  kimiConcepts,
  kimiDigestCards,
  kimiEvidenceMappings,
  kimiEvidenceRegister,
  kimiKeyFinding,
} from '@/lib/kimi-reader-content'
import { Diagram } from './diagram'
import { KimiQuestionPanel } from './kimi-question-panel'
import { PdfPage } from './pdf-page'
import { ReaderPaperSearch } from './reader-paper-search'

type PackedReportReaderProps = {
  slug: string
  title: string
  sourceTitle: string
  authors: readonly string[]
  publicationDate: string
  originalUrl: string
  pdfPath: string
  reportPath: string
  pageCount: number
}

const summaryIcons = [Zap, Target, BarChart3] as const

function formatPublicationDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function PackedReportReader({
  slug,
  title,
  sourceTitle,
  authors,
  publicationDate,
  originalUrl,
  pdfPath,
  reportPath,
  pageCount,
}: PackedReportReaderProps): React.JSX.Element {
  const paperPaneRef = useRef<HTMLElement>(null)
  const mobileTriggerRef = useRef<HTMLButtonElement>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [zoom, setZoom] = useState(0.9)
  const [mobileSourceOpen, setMobileSourceOpen] = useState(false)
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<
    keyof typeof kimiEvidenceMappings
  >('evidence-model-scale')
  const [selectedEvidenceBlockId, setSelectedEvidenceBlockId] =
    useState('key-finding')
  const selectedEvidence = kimiEvidenceMappings[selectedEvidenceId]

  function selectSourcePage(
    nextPage: number,
    openMobile = window.matchMedia('(max-width: 760px)').matches,
  ): void {
    setPageNumber(Math.min(pageCount, Math.max(1, nextPage)))
    if (openMobile) setMobileSourceOpen(true)
  }

  function selectEvidence(
    evidenceId: keyof typeof kimiEvidenceMappings,
    blockId: string,
  ): void {
    const evidence = kimiEvidenceMappings[evidenceId]
    setSelectedEvidenceId(evidenceId)
    setSelectedEvidenceBlockId(blockId)
    selectSourcePage(evidence.pageNumber)
  }

  async function enterFullscreen(): Promise<void> {
    await paperPaneRef.current?.requestFullscreen()
  }

  const sourcePanel = (
    <div className="kimi-source-panel">
      <div className="reader-results-strip">
        <div>
          <Badge tone="violet">Kimi K3</Badge>
          <span>1 of 1 results</span>
        </div>
        <div aria-label="Search result navigation">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Previous search result"
            disabled
          >
            <ChevronLeft aria-hidden="true" size={17} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Next search result"
            disabled
          >
            <ChevronRight aria-hidden="true" size={17} />
          </Button>
        </div>
      </div>

      <div className="pdf-toolbar kimi-pdf-toolbar" aria-label="PDF controls">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Document outline"
          disabled
        >
          <List aria-hidden="true" size={17} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Previous page"
          disabled={pageNumber <= 1}
          onClick={() => selectSourcePage(pageNumber - 1)}
        >
          <ArrowUp aria-hidden="true" size={17} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Next page"
          disabled={pageNumber >= pageCount}
          onClick={() => selectSourcePage(pageNumber + 1)}
        >
          <ArrowDown aria-hidden="true" size={17} />
        </Button>
        <span className="pdf-page-count">
          <b>{pageNumber}</b> / {pageCount}
        </span>
        <span className="pdf-toolbar-spacer" aria-hidden="true" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Zoom out"
          disabled={zoom <= 0.7}
          onClick={() => setZoom((value) => Math.max(0.7, value - 0.1))}
        >
          <Minus aria-hidden="true" size={17} />
        </Button>
        <span className="zoom-value">{Math.round(zoom * 100)}%</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Zoom in"
          disabled={zoom >= 1.3}
          onClick={() => setZoom((value) => Math.min(1.3, value + 0.1))}
        >
          <Plus aria-hidden="true" size={17} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="View source pane fullscreen"
          onClick={() => void enterFullscreen()}
        >
          <Expand aria-hidden="true" size={17} />
        </Button>
        <a
          className="pdf-external-link"
          href={pdfPath}
          download
          aria-label="Download source PDF"
        >
          <Download aria-hidden="true" size={17} />
        </a>
      </div>

      <PdfPage
        src={pdfPath}
        pageNumber={pageNumber}
        zoom={zoom}
        boxes={
          selectedEvidence.pageNumber === pageNumber
            ? selectedEvidence.boxes
            : []
        }
        onHighlight={() => undefined}
        pageImagePath={`/papers/kimi-k3-pages/page-${String(pageNumber).padStart(2, '0')}.png`}
        highlightNumber={selectedEvidence.number}
      />
    </div>
  )

  return (
    <div className="reader-layout kimi-reader-layout">
      <aside
        ref={paperPaneRef}
        className="paper-pane kimi-paper-pane"
        aria-label="Kimi K3 source document"
      >
        <ReaderPaperSearch papers={[{ slug, title }]} />
        {sourcePanel}
      </aside>

      <section
        className="report-pane kimi-digest-pane"
        aria-label="Glyph digest"
      >
        <header className="reader-report-header kimi-report-header">
          <div className="kimi-report-kicker-row">
            <span className="eyebrow">Glyph Digest</span>
            <a
              className="full-report-link"
              href={reportPath}
              target="_blank"
              rel="noreferrer"
            >
              <FileText aria-hidden="true" size={15} /> Full report
            </a>
          </div>
          <h1>{title}</h1>
          <p className="reader-byline">
            <span>{authors.join(', ')}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={publicationDate}>
              {formatPublicationDate(publicationDate)}
            </time>
            <span aria-hidden="true">·</span>
            <a href={originalUrl} target="_blank" rel="noreferrer">
              {sourceTitle} <ExternalLink aria-hidden="true" size={13} />
            </a>
          </p>
        </header>

        <Button
          ref={mobileTriggerRef}
          type="button"
          variant="secondary"
          className="mobile-source-trigger"
          onClick={() => setMobileSourceOpen(true)}
        >
          <FileText aria-hidden="true" size={16} /> Open source PDF
        </Button>

        <KimiQuestionPanel
          slug={slug}
          activeEvidenceId={
            selectedEvidenceBlockId.startsWith('glyph-answer-')
              ? selectedEvidenceId
              : null
          }
          onSelectEvidence={(evidenceId) =>
            selectEvidence(evidenceId, `glyph-answer-${evidenceId}`)
          }
        />

        <TabsRoot defaultValue="summary" className="depth-tabs kimi-depth-tabs">
          <TabsList className="tabs-list" aria-label="Kimi K3 digest sections">
            <TabsTrigger value="summary" className="tabs-trigger">
              Executive Summary
            </TabsTrigger>
            <TabsTrigger value="concepts" className="tabs-trigger">
              Concepts
            </TabsTrigger>
            <TabsTrigger value="evidence" className="tabs-trigger">
              Causal Evidence
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="tabs-content">
            <section
              className="kimi-summary-section"
              aria-labelledby="summary-title"
            >
              <h2 id="summary-title">Executive Summary</h2>
              <div className="kimi-summary-cards">
                {kimiDigestCards.map((card, index) => {
                  const Icon = summaryIcons[index] ?? Zap
                  return (
                    <Card
                      className={`kimi-summary-card${card.evidenceId ? ' kimi-evidence-linked' : ''}${selectedEvidenceBlockId === `summary-${card.id}` ? ' is-evidence-active' : ''}`}
                      key={card.id}
                    >
                      <span className="kimi-summary-icon" aria-hidden="true">
                        <Icon size={22} />
                      </span>
                      <div>
                        <h3>{card.title}</h3>
                        <p>{card.body}</p>
                        {card.evidenceId ? (
                          <button
                            type="button"
                            onClick={() =>
                              selectEvidence(
                                card.evidenceId,
                                `summary-${card.id}`,
                              )
                            }
                          >
                            <span className="evidence-reference-number">
                              {kimiEvidenceMappings[card.evidenceId].number}
                            </span>{' '}
                            {card.provenance}
                          </button>
                        ) : (
                          <span className="evidence-unavailable">
                            {card.provenance} · NO SINGLE EXACT PASSAGE
                          </span>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>
            </section>

            <Card
              className={`kimi-finding-card kimi-evidence-linked${selectedEvidenceBlockId === 'key-finding' ? ' is-evidence-active' : ''}`}
              data-evidence-id={kimiKeyFinding.evidenceId}
            >
              <div className="kimi-finding-label">
                <Quote aria-hidden="true" size={19} />
                <strong>{kimiKeyFinding.label}</strong>
              </div>
              <blockquote>{kimiKeyFinding.text}</blockquote>
              <button
                type="button"
                onClick={() =>
                  selectEvidence(kimiKeyFinding.evidenceId, 'key-finding')
                }
              >
                <span className="evidence-reference-number">1</span>{' '}
                {kimiKeyFinding.source}
              </button>
            </Card>

            <Card className="kimi-concept-glance">
              <div>
                <span className="eyebrow">Concept at a glance</span>
                <h2>Hybrid sequence, depth, and expert routing</h2>
                <p>
                  KDA and AttnRes change information flow before sparse experts
                  process each token. This diagram contains only relationships
                  disclosed in the supplied source.
                </p>
              </div>
              <Diagram spec={kimiArchitectureVisual} />
            </Card>
          </TabsContent>

          <TabsContent value="concepts" className="tabs-content">
            <section
              className="kimi-tab-section"
              aria-labelledby="concepts-title"
            >
              <span className="eyebrow">Technical concepts</span>
              <h2 id="concepts-title">Concepts used by the Kimi K3 report</h2>
              <div className="kimi-concept-list">
                {kimiConcepts.map((concept) => (
                  <Card key={concept.id} className="kimi-concept-card">
                    <h3>{concept.title}</h3>
                    <p>{concept.body}</p>
                    <button
                      type="button"
                      onClick={() => selectSourcePage(concept.pageNumber)}
                    >
                      {concept.source}
                    </button>
                  </Card>
                ))}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="evidence" className="tabs-content">
            <section
              className="kimi-tab-section"
              aria-labelledby="evidence-title"
            >
              <span className="eyebrow">Causal evidence</span>
              <h2 id="evidence-title">Claims, support, and limits</h2>
              <p className="kimi-tab-intro">
                Source claims, Glyph interpretations, and missing validation are
                kept distinct. Selecting a record opens its actual source page.
              </p>
              <div className="kimi-evidence-list">
                {kimiEvidenceRegister.map((item) => (
                  <Card
                    key={item.id}
                    className={`kimi-evidence-card${item.evidenceId ? ' kimi-evidence-linked' : ''}${selectedEvidenceBlockId === `register-${item.id}` ? ' is-evidence-active' : ''}`}
                  >
                    <div>
                      <Badge
                        tone={
                          item.status === 'INSUFFICIENT EVIDENCE'
                            ? 'amber'
                            : 'violet'
                        }
                      >
                        {item.kind}
                      </Badge>
                      <strong>{item.status}</strong>
                    </div>
                    <p>{item.text}</p>
                    <small>{item.limitation}</small>
                    {item.evidenceId ? (
                      <button
                        type="button"
                        onClick={() =>
                          selectEvidence(item.evidenceId, `register-${item.id}`)
                        }
                      >
                        <span className="evidence-reference-number">
                          {kimiEvidenceMappings[item.evidenceId].number}
                        </span>{' '}
                        Open exact source passage on page {item.pageNumber}
                      </button>
                    ) : (
                      <span className="evidence-unavailable" role="status">
                        INSUFFICIENT_EVIDENCE · no exact local passage mapped
                      </span>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          </TabsContent>
        </TabsRoot>
      </section>

      <Sheet
        open={mobileSourceOpen}
        onOpenChange={(open) => {
          setMobileSourceOpen(open)
          if (!open)
            window.setTimeout(() => mobileTriggerRef.current?.focus(), 0)
        }}
      >
        <SheetContent
          title="Kimi K3 source PDF"
          description="The supplied 21-page Kimi K3 launch post"
          className="mobile-evidence-sheet kimi-mobile-source"
        >
          {sourcePanel}
        </SheetContent>
      </Sheet>
    </div>
  )
}
