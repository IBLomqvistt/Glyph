import { randomUUID } from 'node:crypto'
import type {
  AuthGateway,
  ReportImportDraft,
  ReportImportResult,
  ReportImportStore,
} from '@glyph/application'
import {
  paperVersionById,
  evidenceForPaperVersion,
} from '../lib/report-catalog'
import { DemoAuthGateway } from './demo-auth'
import { importClaudeHtml } from './report-importer'
import { LocalReportImportStore } from './local-report-import-store'

export const maximumReportHtmlBytes = 10 * 1024 * 1024

export class ReportImportRequestError extends Error {
  constructor(
    readonly code:
      'INVALID_REPORT_FILE' | 'REPORT_FILE_TOO_LARGE' | 'UNKNOWN_PAPER_VERSION',
    readonly status: 400 | 413,
  ) {
    super(code)
    this.name = 'ReportImportRequestError'
  }
}

type Dependencies = {
  authGateway: AuthGateway
  store: ReportImportStore
  now: () => Date
}

const defaultDependencies: Dependencies = {
  authGateway: new DemoAuthGateway(),
  store: new LocalReportImportStore(),
  now: () => new Date(),
}

export async function createReportImport(
  input: {
    paperVersionId: string
    originalFileName: string
    htmlBytes: Uint8Array
  },
  dependencies: Dependencies = defaultDependencies,
): Promise<ReportImportResult> {
  await dependencies.authGateway.requireRole('EDITOR')
  if (
    input.htmlBytes.byteLength === 0 ||
    input.htmlBytes.byteLength > maximumReportHtmlBytes ||
    !input.originalFileName.toLowerCase().endsWith('.html')
  ) {
    throw new ReportImportRequestError(
      input.htmlBytes.byteLength > maximumReportHtmlBytes
        ? 'REPORT_FILE_TOO_LARGE'
        : 'INVALID_REPORT_FILE',
      input.htmlBytes.byteLength > maximumReportHtmlBytes ? 413 : 400,
    )
  }
  const paperVersion = paperVersionById(input.paperVersionId)
  if (!paperVersion) {
    throw new ReportImportRequestError('UNKNOWN_PAPER_VERSION', 400)
  }
  const html = new TextDecoder('utf-8', { fatal: true }).decode(input.htmlBytes)
  const imported = importClaudeHtml({
    html,
    originalFileName: input.originalFileName,
    paperVersion,
    evidenceSpans: evidenceForPaperVersion(paperVersion.id),
    now: dependencies.now(),
  })
  const draftId = `report-import-${randomUUID()}`
  const draft: ReportImportDraft = {
    id: draftId,
    originalFileName: input.originalFileName,
    htmlSha256: imported.htmlSha256,
    reportPackage: imported.reportPackage,
    createdAt: imported.reportPackage.importedAt,
    reviewStatus: 'PENDING',
    reviewedAt: null,
    reviewerId: null,
    rejectionReason: null,
  }
  await dependencies.store.save(draft)

  return {
    draftId,
    previewUrl: `/editor/report-imports/${draftId}`,
    blockers: imported.reportPackage.diagnostics.filter(
      (diagnostic) => diagnostic.severity === 'BLOCKER',
    ),
    warnings: imported.reportPackage.diagnostics.filter(
      (diagnostic) => diagnostic.severity === 'WARNING',
    ),
    extractedAssetSummary: imported.extractedAssetSummary,
  }
}

export async function getReportImport(
  id: string,
  dependencies: Pick<
    Dependencies,
    'authGateway' | 'store'
  > = defaultDependencies,
): Promise<ReportImportDraft | null> {
  await dependencies.authGateway.requireRole('EDITOR')
  return dependencies.store.get(id)
}

export async function approveReportImport(
  id: string,
  dependencies: Dependencies = defaultDependencies,
): Promise<ReportImportDraft> {
  const user = await dependencies.authGateway.requireRole('EDITOR')
  return dependencies.store.approve({
    id,
    reviewerId: user.id,
    approvedAt: dependencies.now().toISOString(),
  })
}

export async function rejectReportImport(
  id: string,
  reason: string,
  dependencies: Dependencies = defaultDependencies,
): Promise<ReportImportDraft> {
  const user = await dependencies.authGateway.requireRole('EDITOR')
  return dependencies.store.reject({
    id,
    reviewerId: user.id,
    rejectedAt: dependencies.now().toISOString(),
    reason,
  })
}
