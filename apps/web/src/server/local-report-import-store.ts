import { randomUUID } from 'node:crypto'
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  type ReportImportDraft,
  type ReportImportStore,
} from '@glyph/application'
import { ReportPackageSchema, type Id } from '@glyph/domain'

const safeDraftId = /^[A-Za-z0-9_.:-]+$/

export class LocalReportImportStore implements ReportImportStore {
  readonly #directory: string

  constructor(directory = resolveGlyphDataDirectory()) {
    this.#directory = path.join(directory, 'report-imports')
  }

  async save(draft: ReportImportDraft): Promise<void> {
    assertSafeDraftId(draft.id)
    await mkdir(this.#directory, { recursive: true })
    await writeJsonAtomically(this.#draftPath(draft.id), draft)
  }

  async get(id: Id): Promise<ReportImportDraft | null> {
    assertSafeDraftId(id)
    try {
      return parseDraft(await readFile(this.#draftPath(id), 'utf8'))
    } catch (error) {
      if (isMissingFile(error)) return null
      throw error
    }
  }

  async list(): Promise<ReportImportDraft[]> {
    try {
      const fileNames = (await readdir(this.#directory)).filter((fileName) =>
        fileName.endsWith('.json'),
      )
      const drafts = await Promise.all(
        fileNames.map((fileName) =>
          readFile(path.join(this.#directory, fileName), 'utf8').then(
            parseDraft,
          ),
        ),
      )
      return drafts.sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt),
      )
    } catch (error) {
      if (isMissingFile(error)) return []
      throw error
    }
  }

  async findApprovedBySlug(slug: string): Promise<ReportImportDraft | null> {
    return (
      (await this.list()).find(
        (draft) =>
          draft.reviewStatus === 'APPROVED' &&
          draft.reportPackage.slug === slug,
      ) ?? null
    )
  }

  async approve(input: {
    id: Id
    reviewerId: Id
    approvedAt: string
  }): Promise<ReportImportDraft> {
    const draft = await this.#required(input.id)
    if (
      draft.reportPackage.diagnostics.some(
        (diagnostic) => diagnostic.severity === 'BLOCKER',
      )
    ) {
      throw new Error('REPORT_IMPORT_HAS_BLOCKERS')
    }
    const approved: ReportImportDraft = {
      ...draft,
      reviewStatus: 'APPROVED',
      reviewedAt: input.approvedAt,
      reviewerId: input.reviewerId,
      rejectionReason: null,
      reportPackage: ReportPackageSchema.parse({
        ...draft.reportPackage,
        status: 'APPROVED',
        approvedAt: input.approvedAt,
      }),
    }
    await this.save(approved)
    return approved
  }

  async reject(input: {
    id: Id
    reviewerId: Id
    rejectedAt: string
    reason: string
  }): Promise<ReportImportDraft> {
    const draft = await this.#required(input.id)
    const rejected: ReportImportDraft = {
      ...draft,
      reviewStatus: 'REJECTED',
      reviewedAt: input.rejectedAt,
      reviewerId: input.reviewerId,
      rejectionReason:
        input.reason.trim() || 'Rejected during editorial review',
    }
    await this.save(rejected)
    return rejected
  }

  #draftPath(id: string): string {
    return path.join(this.#directory, `${id}.json`)
  }

  async #required(id: Id): Promise<ReportImportDraft> {
    const draft = await this.get(id)
    if (!draft) throw new Error('REPORT_IMPORT_NOT_FOUND')
    return draft
  }
}

export function resolveGlyphDataDirectory(cwd = process.cwd()): string {
  const configured = process.env.GLYPH_DATA_DIR?.trim()
  if (configured) {
    return configured.startsWith('file:')
      ? fileURLToPath(configured)
      : path.resolve(configured)
  }
  let current = path.resolve(cwd)
  while (true) {
    const packageJson = path.join(current, 'package.json')
    if (existsSync(packageJson)) {
      try {
        const parsed = JSON.parse(readFileSync(packageJson, 'utf8')) as {
          name?: string
        }
        if (parsed.name === 'glyph') return path.join(current, '.glyph-data')
      } catch {
        // Continue walking; malformed unrelated package.json files are ignored.
      }
    }
    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }
  return path.resolve(cwd, '.glyph-data')
}

export function localPathToFileUrl(value: string): string {
  return pathToFileURL(path.resolve(value)).href
}

export function fileUrlToLocalPath(value: string): string {
  return fileURLToPath(value)
}

function parseDraft(json: string): ReportImportDraft {
  const candidate = JSON.parse(json) as ReportImportDraft
  return {
    ...candidate,
    reportPackage: ReportPackageSchema.parse(candidate.reportPackage),
  }
}

async function writeJsonAtomically(
  destination: string,
  value: unknown,
): Promise<void> {
  const temporary = `${destination}.${randomUUID()}.tmp`
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  await rename(temporary, destination)
}

function isMissingFile(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === 'ENOENT'
  )
}

function assertSafeDraftId(id: string): void {
  if (!safeDraftId.test(id)) throw new Error('INVALID_REPORT_IMPORT_ID')
}
