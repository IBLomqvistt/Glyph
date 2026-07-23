import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { ReportImportDraft } from '@glyph/application'
import { ReportPackageSchema } from '@glyph/domain'
import {
  LocalReportImportStore,
  fileUrlToLocalPath,
  localPathToFileUrl,
} from './local-report-import-store'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  )
})

describe('LocalReportImportStore', () => {
  it('persists, approves, and retrieves a report package by slug', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'glyph-import-store-'))
    temporaryDirectories.push(directory)
    const store = new LocalReportImportStore(directory)
    const draft = fixtureDraft()
    await store.save(draft)

    expect(await store.get(draft.id)).toEqual(draft)
    const approved = await store.approve({
      id: draft.id,
      reviewerId: 'editor-local',
      approvedAt: '2026-07-22T13:00:00.000Z',
    })
    expect(approved.reviewStatus).toBe('APPROVED')
    expect(approved.reportPackage.status).toBe('APPROVED')
    expect((await store.findApprovedBySlug('second-report'))?.id).toBe(draft.id)
  })

  it('refuses approval while an import blocker remains', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'glyph-import-store-'))
    temporaryDirectories.push(directory)
    const store = new LocalReportImportStore(directory)
    const draft = fixtureDraft(true)
    await store.save(draft)
    await expect(
      store.approve({
        id: draft.id,
        reviewerId: 'editor-local',
        approvedAt: '2026-07-22T13:00:00.000Z',
      }),
    ).rejects.toThrow('REPORT_IMPORT_HAS_BLOCKERS')
  })

  it('round-trips local Windows-compatible paths through file URLs', () => {
    const localPath = path.resolve('tmp', 'Report package', 'draft.json')
    const url = localPathToFileUrl(localPath)
    expect(url.startsWith('file:')).toBe(true)
    expect(fileUrlToLocalPath(url)).toBe(localPath)
  })
})

function fixtureDraft(blocked = false): ReportImportDraft {
  const diagnostic = {
    severity: 'BLOCKER' as const,
    code: 'UNKNOWN_EVIDENCE',
    message: 'Unknown evidence.',
    recordId: 'claim-one',
  }
  const reportPackage = ReportPackageSchema.parse({
    packageVersion: 1,
    id: 'package-second-report',
    slug: 'second-report',
    paperVersionId: 'kimi-k3-tech-blog-2026-07-21',
    status: blocked ? 'BLOCKED' : 'DRAFT',
    metadata: {
      title: 'Second report',
      description: 'A second report.',
      provider: 'Moonshot AI',
      authors: ['Glyph Research'],
      publicationDate: '2026-07-21',
      readingTimeMinutes: 8,
      originalUrl: 'https://www.kimi.com/blog/kimi-k3',
      sourceTitle: 'Kimi K3 launch post',
    },
    themeCss: '',
    tabs: [
      { id: 'summary', label: 'Summary', sectionIds: ['summary'] },
      { id: 'mechanism', label: 'Mechanism', sectionIds: ['mechanism'] },
      { id: 'economics', label: 'Economics', sectionIds: ['economics'] },
    ],
    sections: [
      section('summary', 'summary'),
      section('mechanism', 'mechanism'),
      section('economics', 'economics'),
    ],
    claims: [],
    concepts: [],
    visuals: [],
    sources: [],
    evidenceReferences: [],
    diagnostics: blocked ? [diagnostic] : [],
    importedAt: '2026-07-22T12:00:00.000Z',
    approvedAt: null,
  })
  return {
    id: 'draft-second-report',
    originalFileName: 'second-report.html',
    htmlSha256: 'a'.repeat(64),
    reportPackage,
    createdAt: reportPackage.importedAt,
    reviewStatus: 'PENDING',
    reviewedAt: null,
    reviewerId: null,
    rejectionReason: null,
  }
}

function section(
  id: 'summary' | 'mechanism' | 'economics',
  tabId: 'summary' | 'mechanism' | 'economics',
) {
  return {
    id,
    tabId,
    heading: id,
    html: `<p>${id}</p>`,
    claimIds: [],
    conceptIds: [],
    visualIds: [],
    evidenceIds: [],
  }
}
