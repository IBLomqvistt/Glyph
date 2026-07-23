import { randomUUID } from 'node:crypto'
import { type NextRequest, NextResponse } from 'next/server'
import {
  ReportQuestionRequestError,
  answerReportQuestion,
} from '../../../../../server/report-questions'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const sessionCookieName = 'glyph-question-session'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await context.params
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return errorResponse('INVALID_QUESTION', 400)
  }

  const existingSessionId = request.cookies.get(sessionCookieName)?.value
  const sessionId = existingSessionId ?? randomUUID()
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    'local-unknown'

  try {
    const response = NextResponse.json(
      await answerReportQuestion(slug, payload, { sessionId, ipAddress }),
      { headers: { 'Cache-Control': 'no-store' } },
    )
    if (!existingSessionId) {
      response.cookies.set(sessionCookieName, sessionId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24,
        path: '/',
      })
    }
    return response
  } catch (error) {
    if (error instanceof ReportQuestionRequestError) {
      return errorResponse(error.code, error.status, error.retryAfterSeconds)
    }
    if (
      error instanceof Error &&
      (error.name === 'ExternalAiDisabledError' ||
        error.message.includes('required when live AI is enabled') ||
        error.message === 'DURABLE_QUESTION_QUOTA_REQUIRED')
    ) {
      return errorResponse('LIVE_AI_UNAVAILABLE', 503)
    }
    return errorResponse('EVIDENCE_VALIDATION_FAILED', 502)
  }
}

function errorResponse(
  code: string,
  status: number,
  retryAfterSeconds: number | null = null,
): NextResponse {
  return NextResponse.json(
    { error: { code } },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        ...(retryAfterSeconds
          ? { 'Retry-After': String(retryAfterSeconds) }
          : {}),
      },
    },
  )
}
