'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { editorialReviewBlockers } from '@glyph/domain'
import { edition } from '@/lib/edition'
import { DemoAuthGateway } from '@/server/demo-auth'

const pipelineCookie = 'glyph-pipeline-state'
const approvalCookie = 'glyph-local-approval'
const submissionCookie = 'glyph-editor-submission'
const contextCookie = 'glyph-editor-context-count'
const uploadCookie = 'glyph-editor-upload-staged'

export async function acceptSubmissionAction(): Promise<void> {
  await new DemoAuthGateway().requireRole('EDITOR')
  const store = await cookies()
  store.set(submissionCookie, 'accepted-for-local-review', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })
  revalidatePath('/editor')
}

export async function addContextAction(input: FormData): Promise<void> {
  await new DemoAuthGateway().requireRole('EDITOR')
  const context = input.get('context')
  if (typeof context !== 'string' || context.trim().length < 3) {
    throw new Error('INVALID_CONTEXT: add at least three characters')
  }
  const store = await cookies()
  const current = Number.parseInt(store.get(contextCookie)?.value ?? '0', 10)
  store.set(contextCookie, String(Number.isFinite(current) ? current + 1 : 1), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })
  revalidatePath('/editor')
}

export async function stageUploadAction(input: FormData): Promise<void> {
  await new DemoAuthGateway().requireRole('EDITOR')
  const file = input.get('paper')
  if (!(file instanceof File) || file.size === 0) {
    throw new Error('INVALID_UPLOAD: select a PDF, DOCX, or TXT file')
  }
  const allowedTypes = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ])
  if (!allowedTypes.has(file.type) || file.size > 50 * 1024 * 1024) {
    throw new Error('INVALID_UPLOAD: unsupported file type or file over 50 MB')
  }
  const store = await cookies()
  store.set(uploadCookie, 'validated-local-staging', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })
  revalidatePath('/editor')
}

export async function runPipelineAction(): Promise<void> {
  await new DemoAuthGateway().requireRole('EDITOR')
  const store = await cookies()
  store.set(pipelineCookie, 'complete', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })
}

export async function simulateFailureAction(): Promise<void> {
  await new DemoAuthGateway().requireRole('EDITOR')
  const store = await cookies()
  store.set(pipelineCookie, 'failed', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })
  store.delete(approvalCookie)
}

export async function retryPipelineAction(): Promise<void> {
  await new DemoAuthGateway().requireRole('EDITOR')
  const store = await cookies()
  if (store.get(pipelineCookie)?.value !== 'failed') {
    throw new Error('RETRY_NOT_AVAILABLE: no failed demo stage')
  }
  store.set(pipelineCookie, 'retried', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })
}

export async function resetPipelineAction(): Promise<void> {
  await new DemoAuthGateway().requireRole('EDITOR')
  const store = await cookies()
  store.delete(pipelineCookie)
  store.delete(approvalCookie)
}

export async function approveDemoAction(): Promise<void> {
  await new DemoAuthGateway().requireRole('EDITOR')
  const blockers = editorialReviewBlockers({
    report: edition.report,
    paperVersion: edition.version,
    claims: edition.claims,
    evidenceSpans: edition.evidenceSpans,
    visuals: edition.visuals,
    marketMetrics: [],
    integrityReview: {
      pageMappingsValidated: true,
      definitionsValidated: true,
      claimKindsDistinct: true,
      visualsValidated: true,
    },
  })
  if (blockers.length > 0) {
    throw new Error(
      `PUBLICATION_BLOCKED: ${blockers.map((blocker) => blocker.code).join(', ')}`,
    )
  }
  const store = await cookies()
  store.set(approvalCookie, 'approved-preview-only', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })
}
