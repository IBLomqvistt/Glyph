'use client'

import { useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Minus,
  Plus,
  Quote,
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
import type {
  Claim,
  ConceptCard as Concept,
  EvidenceSpan,
  QuestionAnswer,
  ReportSection,
  VisualSpec,
} from '@glyph/domain'
import { ConceptCard } from './concept-card'
import { Diagram } from './diagram'
import { PdfPage } from './pdf-page'
import { ReaderPaperSearch } from './reader-paper-search'

type ReaderProps = {
  slug: string
  title: string
  authors: string[]
  publicationDate: string
  sourceLabel: string
  originalUrl: string
  pdfPath: string
  paperVersionId: string
  pageCount: number
  pageImageBasePath?: string
  sections: ReportSection[]
  claims: Claim[]
  evidenceSpans: EvidenceSpan[]
  concepts: Concept[]
  visuals: VisualSpec[]
  answers: QuestionAnswer[]
  initialEvidenceId?: string
}

type NarrativeGroup = {
  id: string
  number: string
  title: string
  description: string
  sectionKinds: readonly ReportSection['kind'][]
  technical?: boolean
}

const narrativeGroups: readonly NarrativeGroup[] = [
  {
    id: 'executive-summary',
    number: '01',
    title: 'Executive summary',
    description:
      'The paper’s central claim, provenance, novelty, strongest evidence, and largest uncertainty.',
    sectionKinds: [
      'PAPER_IN_ONE_SENTENCE',
      'VISUAL_ABSTRACT',
      'EXECUTIVE_SUMMARY',
    ],
  },
  {
    id: 'background-landscape',
    number: '02',
    title: 'Background and current landscape',
    description:
      'Concepts, architectural history, competing approaches, and what changes relative to the existing landscape.',
    sectionKinds: ['BACKGROUND'],
  },
  {
    id: 'mechanism',
    number: '03',
    title: 'Mechanism in plain English',
    description:
      'A step-by-step explanation that keeps the baseline and each compute phase distinct.',
    sectionKinds: ['MECHANISM'],
  },
  {
    id: 'technical-evidence',
    number: '04',
    title: 'Technical evidence',
    description:
      'Benchmarks, conditions, calculations, missing experiments, and contradictory evidence.',
    sectionKinds: ['TECHNICAL_EVIDENCE'],
    technical: true,
  },
  {
    id: 'ai-frontier',
    number: '05',
    title: 'Why this matters for the AI frontier',
    description:
      'Capability, efficiency, scaling, deployment, and competitive implications with demonstrated and future effects separated.',
    sectionKinds: ['AI_FRONTIER'],
  },
  {
    id: 'ai-trade',
    number: '06',
    title: 'Why this matters for the AI trade',
    description:
      'A conditional synthesis of supply-chain, bottleneck, sector, positioning, and adoption implications.',
    sectionKinds: ['AI_TRADE', 'WATCH_NEXT'],
  },
] as const

function formatPublicationDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function ReaderExperience(props: ReaderProps): React.JSX.Element {
  const initialEvidence = props.evidenceSpans.find(
    (span) => span.id === props.initialEvidenceId,
  )
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(
    props.initialEvidenceId ?? props.evidenceSpans[0]?.id ?? '',
  )
  const [pageNumber, setPageNumber] = useState(
    initialEvidence?.paperVersionId === props.paperVersionId
      ? initialEvidence.pageNumber
      : (props.evidenceSpans[0]?.pageNumber ?? 1),
  )
  const [zoom, setZoom] = useState(0.9)
  const [mobileEvidenceOpen, setMobileEvidenceOpen] = useState(false)
  const [showConnections, setShowConnections] = useState(false)
  const reportScrollRef = useRef<HTMLDivElement>(null)
  const mobileTriggerRef = useRef<HTMLButtonElement | null>(null)

  const selectedEvidence = props.evidenceSpans.find(
    (span) => span.id === selectedEvidenceId,
  )
  const evidenceError =
    selectedEvidenceId && !selectedEvidence
      ? `Evidence “${selectedEvidenceId}” is unknown. No fallback location was selected.`
      : selectedEvidence &&
          selectedEvidence.paperVersionId !== props.paperVersionId
        ? 'Evidence belongs to another paper version. No highlight was rendered.'
        : null
  const connectedClaims = selectedEvidence
    ? props.claims.filter((claim) =>
        claim.evidenceSpanIds.includes(selectedEvidence.id),
      )
    : []

  function selectEvidence(
    id: string,
    openMobile = false,
    trigger?: HTMLButtonElement,
  ): void {
    const span = props.evidenceSpans.find((candidate) => candidate.id === id)
    setSelectedEvidenceId(id)
    setShowConnections(false)
    if (span && span.paperVersionId === props.paperVersionId)
      setPageNumber(span.pageNumber)
    if (openMobile) {
      mobileTriggerRef.current = trigger ?? null
      setMobileEvidenceOpen(true)
    }
  }

  function changeMobileEvidenceOpen(open: boolean): void {
    setMobileEvidenceOpen(open)
    if (!open) {
      window.setTimeout(() => mobileTriggerRef.current?.focus(), 0)
    }
  }

  const evidencePanel = (
    <div className="paper-pane-inner">
      <div className="pdf-toolbar" aria-label="PDF controls">
        <span className="pdf-title">
          Source paper · page {pageNumber} / {props.pageCount}
        </span>
        <div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Previous page"
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
          >
            <ChevronLeft aria-hidden="true" size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Next page"
            disabled={pageNumber >= props.pageCount}
            onClick={() =>
              setPageNumber((page) => Math.min(props.pageCount, page + 1))
            }
          >
            <ChevronRight aria-hidden="true" size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Zoom out"
            disabled={zoom <= 0.7}
            onClick={() => setZoom((value) => Math.max(0.7, value - 0.1))}
          >
            <Minus aria-hidden="true" size={16} />
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
            <Plus aria-hidden="true" size={16} />
          </Button>
          <a
            className="icon-link"
            href={props.pdfPath}
            aria-label="Open source PDF in new view"
          >
            <ExternalLink aria-hidden="true" size={15} />
          </a>
        </div>
      </div>
      {evidenceError ? (
        <Card
          className="evidence-error"
          role="alert"
          data-testid="evidence-error"
        >
          <strong>Evidence unavailable</strong>
          <p>{evidenceError}</p>
        </Card>
      ) : (
        <PdfPage
          src={props.pdfPath}
          pageNumber={pageNumber}
          zoom={zoom}
          boxes={
            selectedEvidence?.pageNumber === pageNumber
              ? selectedEvidence.boxes
              : []
          }
          onHighlight={() => setShowConnections(true)}
          {...(props.pageImageBasePath
            ? {
                pageImagePath: `${props.pageImageBasePath}/page-${String(pageNumber).padStart(2, '0')}.png`,
              }
            : {})}
        />
      )}
      <div className="sr-only" aria-live="polite">
        {selectedEvidence
          ? `Evidence selected on page ${selectedEvidence.pageNumber}, section ${selectedEvidence.section}.`
          : evidenceError}
      </div>
      {showConnections && connectedClaims.length > 0 ? (
        <Card className="connected-claims" data-testid="connected-claims">
          <h3>Connected claims</h3>
          {connectedClaims.map((claim) => (
            <p key={claim.id}>{claim.text}</p>
          ))}
        </Card>
      ) : null}
    </div>
  )

  return (
    <div className="reader-layout">
      <aside className="paper-pane" aria-label="Source paper evidence">
        <ReaderPaperSearch
          papers={[{ slug: props.slug, title: props.title }]}
        />
        {evidencePanel}
      </aside>
      <div className="report-pane" ref={reportScrollRef}>
        <header className="reader-report-header">
          <span className="eyebrow">Glyph Digest</span>
          <h1>{props.title}</h1>
          <p className="reader-byline">
            <span>{props.authors.join(', ')}</span>
            <span className="reader-byline-separator" aria-hidden="true">
              —
            </span>
            <time dateTime={props.publicationDate}>
              {formatPublicationDate(props.publicationDate)}
            </time>
            <span className="reader-byline-separator" aria-hidden="true">
              —
            </span>
            <a href={props.originalUrl}>
              {props.sourceLabel} <ExternalLink aria-hidden="true" size={13} />
            </a>
          </p>
        </header>
        <TabsRoot defaultValue="summary" className="depth-tabs">
          <TabsList className="tabs-list" aria-label="Report sections">
            <TabsTrigger value="summary" className="tabs-trigger">
              Executive Summary
            </TabsTrigger>
            <TabsTrigger value="concepts" className="tabs-trigger">
              Technical concepts
            </TabsTrigger>
            <TabsTrigger value="economics" className="tabs-trigger">
              Economics
            </TabsTrigger>
          </TabsList>
          <TabsContent value="summary" className="tabs-content">
            <div className="report-narrative">
              {narrativeGroups.map((group) => (
                <ReportSectionGroup
                  key={group.id}
                  group={group}
                  sections={props.sections}
                  claims={props.claims}
                  onEvidence={selectEvidence}
                />
              ))}
            </div>
            <DiagramIndex visuals={props.visuals} />
          </TabsContent>
          <TabsContent value="concepts" className="tabs-content">
            <Card className="concepts-panel">
              <span className="eyebrow">Technical concepts</span>
              <h2>Concepts connected to this report</h2>
              <p>
                Open a term without leaving the paper or report. These entries
                can be replaced with the reviewed concept content for each
                paper.
              </p>
              <div className="concept-term-row">
                {props.concepts.map((concept) => (
                  <ConceptCard
                    key={concept.id}
                    concept={concept}
                    allConcepts={props.concepts}
                    visuals={props.visuals}
                  />
                ))}
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="economics" className="tabs-content">
            <Card className="economics-intro">
              <span className="eyebrow">Economics</span>
              <h2>From mechanism to conditional implications</h2>
              <p>
                This view separates demonstrated technical results from possible
                cost, supply-chain, sector, company, and adoption effects. No
                direct trade implication remains a valid outcome.
              </p>
            </Card>
            <ReportSectionGroup
              group={narrativeGroups[5]!}
              sections={props.sections}
              claims={props.claims}
              onEvidence={selectEvidence}
              compact
            />
            <QuestionPanel
              answers={props.answers}
              onEvidence={selectEvidence}
            />
          </TabsContent>
        </TabsRoot>
      </div>

      <Sheet open={mobileEvidenceOpen} onOpenChange={changeMobileEvidenceOpen}>
        <SheetContent
          title="Exact source evidence"
          description="The mapped PDF page and normalized highlight"
          className="mobile-evidence-sheet"
        >
          {evidencePanel}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function ReportSectionGroup({
  group,
  sections,
  claims,
  onEvidence,
  compact = false,
}: {
  group: NarrativeGroup
  sections: ReportSection[]
  claims: Claim[]
  onEvidence: (
    id: string,
    mobile?: boolean,
    trigger?: HTMLButtonElement,
  ) => void
  compact?: boolean
}): React.JSX.Element {
  const matchingSections = sections.filter((section) =>
    group.sectionKinds.includes(section.kind),
  )
  const content = (
    <div className="report-section-body">
      {matchingSections.flatMap((section) =>
        section.blocks.map((block) => (
          <ReportBlockView
            key={block.id}
            block={block}
            claims={claims}
            onEvidence={onEvidence}
          />
        )),
      )}
    </div>
  )

  if (group.technical) {
    return (
      <details
        id={group.id}
        className="report-section technical-details"
        data-testid={`report-section-${group.id}`}
      >
        <summary>
          <span className="report-section-number">{group.number}</span>
          <span>
            <strong>{group.title}</strong>
            <small>{group.description}</small>
          </span>
        </summary>
        {content}
      </details>
    )
  }

  return (
    <section
      id={group.id}
      className={`report-section report-section-${group.id}${compact ? ' report-section-compact' : ''}`}
      data-testid={`report-section-${group.id}`}
    >
      <header className="report-section-head">
        <span className="report-section-number">{group.number}</span>
        <div>
          <h2>{group.title}</h2>
          <p>{group.description}</p>
        </div>
      </header>
      {content}
    </section>
  )
}

function ReportBlockView({
  block,
  claims,
  onEvidence,
}: {
  block: ReportSection['blocks'][number]
  claims: Claim[]
  onEvidence: (
    id: string,
    mobile?: boolean,
    trigger?: HTMLButtonElement,
  ) => void
}): React.JSX.Element {
  return (
    <div className="report-block">
      {block.heading ? <h3>{block.heading}</h3> : null}
      <p className="report-block-summary">{block.body}</p>
      <div className="claim-list">
        {block.claimIds.map((claimId) => {
          const claim = claims.find((candidate) => candidate.id === claimId)
          if (!claim) return null
          return (
            <article
              className={`claim claim-${claim.supportStatus.toLowerCase()}`}
              key={claim.id}
            >
              <div className="claim-heading">
                <Badge
                  tone={
                    claim.supportStatus === 'SUPPORTED'
                      ? 'violet'
                      : claim.supportStatus === 'CONTRADICTED'
                        ? 'red'
                        : 'amber'
                  }
                >
                  {claim.kind.replaceAll('_', ' ')}
                </Badge>
                <span>{claim.supportStatus.replaceAll('_', ' ')}</span>
              </div>
              <p>{claim.text}</p>
              {claim.evidenceSpanIds.length ? (
                <div className="citation-row">
                  {claim.evidenceSpanIds.map((evidenceId) => (
                    <span key={evidenceId}>
                      <button
                        type="button"
                        className="citation desktop-citation"
                        data-testid={`citation-${claim.id}-${evidenceId}`}
                        onClick={() => onEvidence(evidenceId)}
                      >
                        <Quote aria-hidden="true" size={13} /> Show evidence
                      </button>
                      <button
                        type="button"
                        className="citation mobile-citation"
                        onClick={(event) =>
                          onEvidence(evidenceId, true, event.currentTarget)
                        }
                      >
                        <Quote aria-hidden="true" size={13} /> Open evidence
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="insufficient" role="status">
                  INSUFFICIENT_EVIDENCE — no speculative fallback.
                </p>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}

function DiagramIndex({
  visuals,
}: {
  visuals: VisualSpec[]
}): React.JSX.Element {
  return (
    <section id="diagrams" className="reader-diagram-index">
      <span className="eyebrow">Structured visuals</span>
      <h2>{visuals.length} deterministic diagrams</h2>
      <p>
        Labels, arrows, values, and evidence links come from validated
        VisualSpecs.
      </p>
      <div className="reader-diagram-grid">
        {visuals.map((visual) => (
          <div className="reader-inline-diagram" key={visual.id}>
            <Diagram spec={visual} />
          </div>
        ))}
      </div>
    </section>
  )
}

function QuestionPanel({
  answers,
  onEvidence,
}: {
  answers: QuestionAnswer[]
  onEvidence: (id: string) => void
}): React.JSX.Element {
  const [answerId, setAnswerId] = useState(answers[0]?.id ?? '')
  const answer = answers.find((candidate) => candidate.id === answerId)
  return (
    <Card className="qa-panel">
      <span className="eyebrow">Report-scoped cited Q&amp;A</span>
      <h2>Ask only what this fixture can support</h2>
      <div className="question-options">
        {answers.map((candidate) => (
          <Button
            key={candidate.id}
            type="button"
            variant={candidate.id === answerId ? 'primary' : 'secondary'}
            onClick={() => setAnswerId(candidate.id)}
          >
            {candidate.question}
          </Button>
        ))}
      </div>
      {answer ? (
        <div className="answer" aria-live="polite">
          <Badge tone={answer.outcome === 'ANSWER' ? 'green' : 'amber'}>
            {answer.outcome}
          </Badge>
          {answer.answerText ? (
            <p>{answer.answerText}</p>
          ) : (
            <p>No supported answer is available. Glyph stops here.</p>
          )}
          {answer.evidenceSpanIds.map((id) => (
            <button
              key={id}
              type="button"
              className="citation"
              onClick={() => onEvidence(id)}
            >
              Show cited evidence
            </button>
          ))}
        </div>
      ) : null}
    </Card>
  )
}
