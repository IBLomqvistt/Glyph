import { cookies } from 'next/headers'
import {
  Bot,
  Check,
  MessageCircle,
  Paperclip,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from 'lucide-react'
import { Badge, Button, Card } from '@glyph/ui'
import { edition } from '@/lib/edition'
import { ReportImportUpload } from '@/components/report-import-upload'
import { DemoAuthGateway } from '@/server/demo-auth'
import {
  acceptSubmissionAction,
  addContextAction,
  stageUploadAction,
} from './actions'

export const dynamic = 'force-dynamic'

export default async function EditorPage(): Promise<React.JSX.Element> {
  const [user, store] = await Promise.all([
    new DemoAuthGateway().currentUser(),
    cookies(),
  ])

  if (user.role !== 'EDITOR') {
    return (
      <div className="page editor-page">
        <header className="page-header">
          <div>
            <span className="eyebrow">Restricted workspace</span>
            <h1>Editor</h1>
          </div>
        </header>
        <Card className="permission-state" role="status">
          <ShieldCheck aria-hidden="true" />
          <div>
            <h2>Editor permission required</h2>
            <p>
              Agent runs, submissions, context, and publishing metrics are
              visible only to the local editor role.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  const accepted =
    store.get('glyph-editor-submission')?.value === 'accepted-for-local-review'
  const contextCount = Number.parseInt(
    store.get('glyph-editor-context-count')?.value ?? '0',
    10,
  )
  const uploadStaged =
    store.get('glyph-editor-upload-staged')?.value === 'validated-local-staging'

  return (
    <div className="page page-wide editor-dashboard">
      <header className="editor-dashboard-header">
        <span className="eyebrow">Admin workspace</span>
        <h1>Editor</h1>
        <p>Manage agent runs, submissions, and local platform context.</p>
      </header>

      <Card className="agent-runs-card">
        <div className="card-heading-row">
          <div>
            <h2>Agent Runs &amp; Submissions</h2>
            <p>Review evidence-bound content before human approval.</p>
          </div>
          <div className="run-state-legend" aria-label="Available run states">
            <Badge tone="neutral">Queued</Badge>
            <Badge tone="violet">Running</Badge>
            <Badge tone="amber">In review</Badge>
            <Badge tone="green">Completed</Badge>
          </div>
        </div>
        <div className="agent-run-table" role="table" aria-label="Agent runs">
          <div className="agent-run-row agent-run-head" role="row">
            <span role="columnheader">Paper / title</span>
            <span role="columnheader">Agent</span>
            <span role="columnheader">Run state</span>
            <span role="columnheader">Comments</span>
            <span role="columnheader">Actions</span>
          </div>
          <div className="agent-run-row" role="row">
            <span role="cell">
              <strong>{edition.paper.title}</strong>
              <small>{edition.version.versionLabel}</small>
            </span>
            <span role="cell">
              <Bot aria-hidden="true" size={16} /> Research agent
            </span>
            <span role="cell">
              <Badge tone={accepted ? 'green' : 'amber'}>
                {accepted ? 'Accepted' : 'In review'}
              </Badge>
            </span>
            <span role="cell">
              <MessageCircle aria-hidden="true" size={15} /> {contextCount}
            </span>
            <span role="cell">
              <form action={acceptSubmissionAction}>
                <Button type="submit" size="small" disabled={accepted}>
                  {accepted ? (
                    <>
                      <Check aria-hidden="true" size={15} /> Accepted
                    </>
                  ) : (
                    'Accept paper'
                  )}
                </Button>
              </form>
            </span>
          </div>
        </div>
      </Card>

      <Card className="report-import-card">
        <div className="card-heading-row">
          <div>
            <span className="eyebrow">Report pipeline</span>
            <h2>Import Claude HTML</h2>
            <p>
              Convert marked HTML into a validated draft. Evidence blockers must
              be resolved before approval.
            </p>
          </div>
          <Badge tone="neutral">Local V1</Badge>
        </div>
        <ReportImportUpload />
      </Card>

      <Card className="context-composer">
        <div>
          <span className="context-icon">
            <Sparkles aria-hidden="true" />
          </span>
          <div>
            <h2>Add Context &amp; Comments</h2>
            <p>Guidance is local to this review and never auto-publishes.</p>
          </div>
        </div>
        <form action={addContextAction}>
          <label className="sr-only" htmlFor="editor-context">
            Add review context
          </label>
          <textarea
            id="editor-context"
            name="context"
            required
            minLength={3}
            placeholder="Add a comment or context for the selected paper…"
          />
          <Button type="submit">Add comment</Button>
        </form>
      </Card>

      <div className="editor-metric-grid">
        <Card className="upload-card">
          <h2>Upload content</h2>
          <p>Validate a file for local staging. Nothing is published.</p>
          <form action={stageUploadAction}>
            <label htmlFor="paper-upload">
              <UploadCloud aria-hidden="true" size={28} />
              <strong>Choose a paper</strong>
              <span>PDF, DOCX, TXT · max 50 MB</span>
            </label>
            <input
              id="paper-upload"
              name="paper"
              type="file"
              accept=".pdf,.docx,.txt"
              required
            />
            <Button type="submit" variant="secondary">
              <Paperclip aria-hidden="true" size={15} /> Validate locally
            </Button>
          </form>
          {uploadStaged ? (
            <p className="local-success" role="status">
              <Check aria-hidden="true" size={15} /> File validated for local
              staging.
            </p>
          ) : null}
        </Card>
        <Card className="metric-card">
          <span className="eyebrow">Followers</span>
          <strong>24,318</strong>
          <p>Synthetic dashboard metric · no live audience connection.</p>
          <div className="metric-line" aria-hidden="true">
            <i />
          </div>
        </Card>
        <Card className="metric-card">
          <span className="eyebrow">Publish cadence</span>
          <strong>
            3.2 <small>previews / week</small>
          </strong>
          <p>Local preview history · publication remains disabled.</p>
          <div className="metric-bars" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </Card>
      </div>
    </div>
  )
}
