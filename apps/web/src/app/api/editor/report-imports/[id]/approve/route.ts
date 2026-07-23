import { NextResponse } from 'next/server'
import { approveReportImport } from '@/server/report-imports'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params
  try {
    const draft = await approveReportImport(id)
    return NextResponse.json(
      {
        status: draft.reviewStatus,
        reportUrl: `/reports/${draft.reportPackage.slug}`,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'REPORT_IMPORT_HAS_BLOCKERS') {
        return errorResponse('REPORT_IMPORT_HAS_BLOCKERS', 409)
      }
      if (error.message === 'REPORT_IMPORT_NOT_FOUND') {
        return errorResponse('REPORT_IMPORT_NOT_FOUND', 404)
      }
      if (error.message.includes('requires EDITOR')) {
        return errorResponse('EDITOR_PERMISSION_REQUIRED', 403)
      }
    }
    return errorResponse('REPORT_IMPORT_APPROVAL_FAILED', 500)
  }
}

function errorResponse(code: string, status: number): NextResponse {
  return NextResponse.json(
    { error: { code } },
    { status, headers: { 'Cache-Control': 'no-store' } },
  )
}
