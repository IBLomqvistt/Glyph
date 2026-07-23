import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ReportPackageSchema, type ReportPackage } from '@glyph/domain'
import { featuredReport } from '../lib/featured-report'
import { kimiEvidenceSpans, kimiPaperVersion } from '../lib/report-catalog'
import { LocalReportImportStore } from './local-report-import-store'
import { importClaudeHtml } from './report-importer'

let builtInKimiPackage: Promise<ReportPackage> | null = null

export async function reportPackageBySlug(
  slug: string,
): Promise<ReportPackage | null> {
  const imported = await new LocalReportImportStore().findApprovedBySlug(slug)
  if (imported) return imported.reportPackage
  if (slug !== featuredReport.slug) return null
  builtInKimiPackage ??= loadBuiltInKimiPackage()
  return builtInKimiPackage
}

async function loadBuiltInKimiPackage(): Promise<ReportPackage> {
  const sourcePath = resolveBuiltInReportSource()
  const sourceHtml = await readFile(sourcePath, 'utf8')
  const imported = importClaudeHtml({
    html: sourceHtml,
    originalFileName: path.basename(sourcePath),
    paperVersion: kimiPaperVersion,
    evidenceSpans: kimiEvidenceSpans,
    now: new Date('2026-07-21T12:00:00.000Z'),
    strictMarkers: false,
    metadata: {
      slug: featuredReport.slug,
      title: featuredReport.title,
      description: featuredReport.summary,
      provider: featuredReport.provider,
      authors: [...featuredReport.authors],
      publicationDate: featuredReport.publicationDate,
      readingTimeMinutes: featuredReport.readingTimeMinutes,
      originalUrl: featuredReport.originalUrl,
      sourceTitle: featuredReport.sourceTitle,
    },
  })
  const reviewedDiagnostics = imported.reportPackage.diagnostics.map(
    (diagnostic) => ({
      ...diagnostic,
      severity: 'WARNING' as const,
      message: `${diagnostic.message} Sanitization was manually reviewed for the built-in Kimi migration.`,
    }),
  )
  return ReportPackageSchema.parse({
    ...imported.reportPackage,
    status: 'APPROVED',
    diagnostics: reviewedDiagnostics,
    approvedAt: '2026-07-21T18:00:00.000Z',
  })
}

function resolveBuiltInReportSource(): string {
  const candidates = [
    path.join(process.cwd(), 'report-sources', 'kimi-k3.html'),
    path.join(process.cwd(), 'apps', 'web', 'report-sources', 'kimi-k3.html'),
  ]
  const sourcePath = candidates.find((candidate) => existsSync(candidate))
  if (!sourcePath) throw new Error('BUILT_IN_KIMI_REPORT_SOURCE_MISSING')
  return sourcePath
}
