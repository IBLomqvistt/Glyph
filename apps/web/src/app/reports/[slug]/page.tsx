import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowRight, Bookmark, Clock3, ExternalLink } from 'lucide-react'
import { Badge, Card } from '@glyph/ui'
import { ContinuousPdfViewer } from '@/components/continuous-pdf-viewer'
import { KimiQuestionPanel } from '@/components/kimi-question-panel'
import { ReportTabViewer } from '@/components/report-tab-viewer'
import { featuredReport } from '@/lib/featured-report'
import { kimiEvidenceSpans, kimiPaperVersion } from '@/lib/report-catalog'
import { DemoAuthGateway } from '@/server/demo-auth'
import { reportPackageBySlug } from '@/server/report-packages'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const reportPackage = await reportPackageBySlug(slug)
  if (!reportPackage) return { title: 'Report unavailable' }
  return {
    title: reportPackage.metadata.title,
    description: reportPackage.metadata.description,
    alternates: { canonical: `/reports/${reportPackage.slug}` },
  }
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<React.JSX.Element> {
  const { slug } = await params
  if (slug === 'archive-preview') return <ArchivePreview />
  if (slug === 'agent-swarm-demo') redirect(`/reports/${featuredReport.slug}`)

  const reportPackage = await reportPackageBySlug(slug)
  if (!reportPackage || reportPackage.status !== 'APPROVED') notFound()
  if (reportPackage.paperVersionId !== kimiPaperVersion.id) notFound()

  return (
    <div className="structured-report-page">
      <header className="structured-report-header">
        <div>
          <span className="eyebrow">Glyph research · approved package</span>
          <h1>{reportPackage.metadata.title}</h1>
          <p className="structured-report-description">
            {reportPackage.metadata.description}
          </p>
          <div className="metadata-row">
            <span>{reportPackage.metadata.provider}</span>
            <time dateTime={reportPackage.metadata.publicationDate}>
              {reportPackage.metadata.publicationDate}
            </time>
            <span>
              <Clock3 aria-hidden="true" />{' '}
              {reportPackage.metadata.readingTimeMinutes} min
            </span>
            {reportPackage.metadata.originalUrl ? (
              <a
                href={reportPackage.metadata.originalUrl}
                target="_blank"
                rel="noreferrer"
              >
                Original source <ExternalLink aria-hidden="true" />
              </a>
            ) : null}
          </div>
          {reportPackage.sources.length > 0 ? (
            <nav
              className="structured-report-sources"
              aria-label="Report sources"
            >
              <span>Sources</span>
              {reportPackage.sources.slice(0, 4).map((source) =>
                source.url ? (
                  <a
                    key={source.id}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {source.label} <ExternalLink aria-hidden="true" />
                  </a>
                ) : (
                  <span key={source.id}>{source.label}</span>
                ),
              )}
            </nav>
          ) : null}
        </div>
        <Badge tone="violet">Provisional launch analysis</Badge>
      </header>

      <div className="structured-report-workspace">
        <ContinuousPdfViewer
          title={reportPackage.metadata.title}
          pdfPath={kimiPaperVersion.assetPath}
          pageCount={kimiPaperVersion.pageCount}
          pageImageBasePath="/papers/kimi-k3-pages"
          evidenceSpans={kimiEvidenceSpans}
          annotations={kimiPdfAnnotations}
        />
        <main className="structured-report-reading">
          <KimiQuestionPanel slug={reportPackage.slug} />
          <ReportTabViewer reportPackage={reportPackage} />
        </main>
      </div>
    </div>
  )
}

const kimiPdfAnnotations = [
  {
    id: 'note-scale',
    evidenceId: 'evidence-model-scale',
    text: '2.8T is total capacity. It does not tell you activated parameters, memory footprint, or cost per token.',
  },
  {
    id: 'note-release',
    evidenceId: 'evidence-pending-technical-report',
    text: 'Weights and the technical report were promised for July 27. Until then, key implementation details remain unverified.',
  },
  {
    id: 'note-routing',
    evidenceId: 'evidence-routing',
    text: '16-of-896 reduces arithmetic. The 2.5× figure is Moonshot’s scaling-efficiency claim, not a disclosed training-cost reduction.',
  },
  {
    id: 'note-attention',
    evidenceId: 'evidence-kda-attnres',
    text: 'KDA controls memory across tokens. AttnRes retrieves across layers. Quantile Balancing targets expert-load imbalance. K3 does not isolate their individual contributions.',
  },
  {
    id: 'note-serving',
    evidenceId: 'evidence-serving-system',
    text: 'MXFP4 cuts memory traffic, but Moonshot still recommends 64-plus accelerators. Efficient does not mean easy or cheap to self-host.',
  },
  {
    id: 'note-price',
    evidenceId: 'evidence-api-economics',
    text: 'The 10× cache discount matters only when context is reused. The reported 90% coding-workload hit rate is a provider claim.',
  },
  {
    id: 'note-benchmark',
    evidenceId: 'evidence-benchmark-harness',
    text: 'Results use maximum reasoning and different agent harnesses. The comparisons are not harness-neutral.',
  },
  {
    id: 'note-limitation',
    evidenceId: 'evidence-limitations',
    text: 'Quality depends on preserving prior thinking state. Session handoffs and model switching are explicit failure modes.',
  },
] as const

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
