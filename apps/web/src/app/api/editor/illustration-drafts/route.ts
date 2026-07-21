import { NextResponse } from 'next/server'
import {
  illustrationPurposes,
  type IllustrationPurpose,
} from '@glyph/application'
import {
  LocalIllustrationGenerationDisabledError,
  generateNonSemanticIllustrationDraft,
} from '@/server/illustration-drafts'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isIllustrationPurpose(value: unknown): value is IllustrationPurpose {
  return illustrationPurposes.some((purpose) => purpose === value)
}

export async function POST(request: Request): Promise<NextResponse> {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return errorResponse('INVALID_JSON', 400)
  }

  if (
    !isRecord(payload) ||
    typeof payload.paperVersionId !== 'string' ||
    !isIllustrationPurpose(payload.purpose) ||
    typeof payload.brief !== 'string' ||
    payload.editorConfirmedNonSemanticUse !== true
  ) {
    return errorResponse('INVALID_ILLUSTRATION_REQUEST', 400)
  }

  try {
    const draft = await generateNonSemanticIllustrationDraft({
      paperVersionId: payload.paperVersionId,
      purpose: payload.purpose,
      brief: payload.brief,
      editorConfirmedNonSemanticUse: true,
    })
    return NextResponse.json(draft, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    if (
      error instanceof LocalIllustrationGenerationDisabledError ||
      (error instanceof Error && error.name === 'ExternalAiDisabledError')
    ) {
      return errorResponse('LIVE_IMAGE_GENERATION_DISABLED', 503)
    }
    if (
      error instanceof Error &&
      error.message.startsWith('PERMISSION_DENIED')
    ) {
      return errorResponse('EDITOR_ROLE_REQUIRED', 403)
    }
    if (
      error instanceof Error &&
      (error.message.startsWith('ILLUSTRATION_') ||
        error.message === 'INVALID_ILLUSTRATION_PURPOSE')
    ) {
      return errorResponse(error.message, 400)
    }
    return errorResponse('IMAGE_GENERATION_FAILED', 502)
  }
}

function errorResponse(code: string, status: number): NextResponse {
  return NextResponse.json(
    { error: { code } },
    { status, headers: { 'Cache-Control': 'no-store' } },
  )
}
