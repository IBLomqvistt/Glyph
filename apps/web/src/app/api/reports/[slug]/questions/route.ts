import { NextResponse } from 'next/server'
import {
  KimiQuestionRequestError,
  answerKimiQuestion,
  isKimiReportSlug,
} from '../../../../../server/kimi-questions'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await context.params
  if (!isKimiReportSlug(slug)) {
    return errorResponse('REPORT_NOT_FOUND', 404)
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return errorResponse('INVALID_QUESTION', 400)
  }

  try {
    return NextResponse.json(await answerKimiQuestion(slug, payload), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    if (error instanceof KimiQuestionRequestError) {
      return errorResponse(error.code, error.status)
    }
    if (
      error instanceof Error &&
      (error.name === 'ExternalAiDisabledError' ||
        error.message.includes('required when live AI is enabled'))
    ) {
      return errorResponse('LIVE_AI_UNAVAILABLE', 503)
    }
    return errorResponse('QUESTION_GENERATION_FAILED', 502)
  }
}

function errorResponse(code: string, status: number): NextResponse {
  return NextResponse.json(
    { error: { code } },
    { status, headers: { 'Cache-Control': 'no-store' } },
  )
}
