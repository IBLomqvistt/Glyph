import { notFound } from 'next/navigation'
import {
  AlertTriangle,
  CheckCircle2,
  FileCode2,
  ShieldAlert,
} from 'lucide-react'
import { Badge, Card } from '@glyph/ui'
import { ReportImportReviewActions } from '@/components/report-import-review-actions'
import { ReportTabViewer } from '@/components/report-tab-viewer'
import { getReportImport } from '@/server/report-imports'

export const dynamic = 'force-dynamic'

export default async function ReportImportReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<React.JSX.Element> {
  const { id } = await params
  let draft
  try {
    draft = await getReportImport(id)
  } catch {
    return (
      <div className="page">
        <Card className="permission-state">
          <ShieldAlert aria-hidden="true" />
          <div>
            <h1>Editor permission required</h1>
            <p>Report drafts are visible only in the local editor workspace.</p>
          </div>
        </Card>
      </div>
    )
  }
  if (!draft) notFound()

  const blockers = draft.reportPackage.diagnostics.filter(
    (diagnostic) => diagnostic.severity === 'BLOCKER',
  )
  const warnings = draft.reportPackage.diagnostics.filter(
    (diagnostic) => diagnostic.severity === 'WARNING',
  )
  const evidenceBoundClaims = draft.reportPackage.claims.filter(
    (claim) => claim.evidenceIds.length > 0,
  ).length

  return (
    <div className="page page-wide report-import-review">
      <header className="page-header report-import-review-header">
        <div>
          <span className="eyebrow">Report import review</span>
          <h1>{draft.reportPackage.metadata.title}</h1>
          <p>
            {draft.originalFileName} · {draft.reportPackage.paperVersionId}
          </p>
        </div>
        <div>
          <Badge tone={blockers.length > 0 ? 'amber' : 'green'}>
            {blockers.length > 0 ? 'Approval blocked' : draft.reviewStatus}
          </Badge>
          <ReportImportReviewActions
            draftId={draft.id}
            blockerCount={blockers.length}
            approved={draft.reviewStatus === 'APPROVED'}
          />
        </div>
      </header>

      <div className="report-import-stats" aria-label="Import summary">
        <Card>
          <FileCode2 aria-hidden="true" />
          <strong>{draft.reportPackage.visuals.length}</strong>
          <span>extracted visuals and tables</span>
        </Card>
        <Card>
          <CheckCircle2 aria-hidden="true" />
          <strong>
            {evidenceBoundClaims}/{draft.reportPackage.claims.length}
          </strong>
          <span>claims with evidence references</span>
        </Card>
        <Card>
          <AlertTriangle aria-hidden="true" />
          <strong>{blockers.length}</strong>
          <span>publication blockers</span>
        </Card>
      </div>

      <section
        className="import-diagnostics"
        aria-labelledby="diagnostics-title"
      >
        <h2 id="diagnostics-title">Import diagnostics</h2>
        {blockers.length === 0 && warnings.length === 0 ? (
          <p className="diagnostic-empty">No import issues found.</p>
        ) : (
          <div className="diagnostic-list">
            {[...blockers, ...warnings].map((diagnostic, index) => (
              <Card key={`${diagnostic.code}-${diagnostic.recordId}-${index}`}>
                <Badge
                  tone={diagnostic.severity === 'BLOCKER' ? 'amber' : 'neutral'}
                >
                  {diagnostic.severity}
                </Badge>
                <div>
                  <strong>{diagnostic.code}</strong>
                  <p>{diagnostic.message}</p>
                  {diagnostic.recordId ? (
                    <small>{diagnostic.recordId}</small>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="import-preview" aria-labelledby="preview-title">
        <div>
          <span className="eyebrow">Sanitized output</span>
          <h2 id="preview-title">Rendered preview</h2>
          <p>Scripts and remote assets are excluded from this preview.</p>
        </div>
        <ReportTabViewer reportPackage={draft.reportPackage} />
      </section>
    </div>
  )
}
