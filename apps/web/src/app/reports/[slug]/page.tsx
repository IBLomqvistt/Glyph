import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowRight, Bookmark, BookOpen, Clock3 } from 'lucide-react'
import { Badge, Card } from '@glyph/ui'
import { featuredReport } from '@/lib/featured-report'
import { DemoAuthGateway } from '@/server/demo-auth'

export default async function ReportLanding({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<React.JSX.Element> {
  const { slug } = await params

  if (slug === 'archive-preview') {
    return <ArchivePreview />
  }
  if (slug === 'agent-swarm-demo') {
    redirect(`/reports/${featuredReport.slug}`)
  }
  if (slug !== featuredReport.slug) notFound()

  return (
    <div className="page report-landing">
      <header className="report-hero">
        <div className="report-heading">
          <span className="eyebrow">{featuredReport.statusLabel}</span>
          <h1>{featuredReport.title}</h1>
          <div className="metadata-row">
            <span>{featuredReport.provider}</span>
            <span>{featuredReport.authors.join(', ')}</span>
            <time dateTime={featuredReport.publicationDate}>
              {featuredReport.publicationDate}
            </time>
            <span>
              <Clock3 aria-hidden="true" size={14} />{' '}
              {featuredReport.readingTimeMinutes} min read
            </span>
          </div>
          <div className="chip-row">
            {featuredReport.topicLabels.map((label) => (
              <Badge key={label} tone="violet">
                {label}
              </Badge>
            ))}
          </div>
        </div>
      </header>

      <div className="report-overview-grid">
        <Card className="selection-card report-overview-main">
          <div>
            <span className="eyebrow">What this report examines</span>
            <p>{featuredReport.summary}</p>
          </div>
          <div>
            <span className="eyebrow">Core research question</span>
            <p>
              Which Kimi K3 efficiency claims are supported by the supplied
              launch evidence, and which still require independent validation?
            </p>
          </div>
          <div>
            <span className="eyebrow">Largest uncertainty</span>
            <p>
              Several architecture results were demonstrated at smaller scale;
              the supplied source does not independently isolate their effect at
              Kimi K3&apos;s full scale.
            </p>
          </div>
        </Card>

        <Card className="key-facts">
          <h2>Key facts</h2>
          <dl>
            <div>
              <dt>Source</dt>
              <dd>{featuredReport.sourceTitle}</dd>
            </div>
            <div>
              <dt>Provider</dt>
              <dd>{featuredReport.provider}</dd>
            </div>
            <div>
              <dt>PDF pages</dt>
              <dd>{featuredReport.pageCount}</dd>
            </div>
            <div>
              <dt>Approval</dt>
              <dd>Provisional · human review required</dd>
            </div>
          </dl>
        </Card>
      </div>

      <nav className="report-entry-grid" aria-label="Report destinations">
        <Link href={featuredReport.reportPath}>
          <BookOpen aria-hidden="true" /> <span>Read report</span>
          <ArrowRight aria-hidden="true" />
        </Link>
        <a href={featuredReport.pdfPath}>
          <FileSourceIcon /> <span>View source PDF</span>
          <ArrowRight aria-hidden="true" />
        </a>
        <a href={featuredReport.originalUrl} target="_blank" rel="noreferrer">
          <FileSourceIcon /> <span>Original Kimi blog</span>
          <ArrowRight aria-hidden="true" />
        </a>
        <Link href="/reports/archive-preview">
          <Bookmark aria-hidden="true" /> <span>Archive access</span>
          <ArrowRight aria-hidden="true" />
        </Link>
      </nav>
    </div>
  )
}

async function ArchivePreview(): Promise<React.JSX.Element> {
  const user = await new DemoAuthGateway().currentUser()
  const canViewArchive = user.role === 'SUBSCRIBER' || user.role === 'EDITOR'

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Subscriber preview</span>
          <h1>Research archive access</h1>
          <p>A server-checked permission boundary for the future archive.</p>
        </div>
      </header>
      <Card className="permission-state" role="status">
        <Bookmark aria-hidden="true" />
        <div>
          <h2>
            {canViewArchive
              ? 'Subscriber access confirmed'
              : 'Subscriber permission required'}
          </h2>
          <p>
            {canViewArchive
              ? 'The provisional Kimi K3 report is available. Additional archive records are not part of this preview.'
              : 'This archive preview is unavailable to the visitor role. Choose the visibly marked subscriber demo role to inspect the allowed state.'}
          </p>
          {canViewArchive ? (
            <Link href={featuredReport.reportPath}>
              Open Kimi K3 report <ArrowRight aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </Card>
    </div>
  )
}

function FileSourceIcon(): React.JSX.Element {
  return (
    <span className="source-icon" aria-hidden="true">
      PDF
    </span>
  )
}
