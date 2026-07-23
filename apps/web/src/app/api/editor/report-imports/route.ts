import { NextResponse } from 'next/server'
import {
  ReportImportRequestError,
  createReportImport,
  maximumReportHtmlBytes,
} from '@/server/report-imports'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request): Promise<NextResponse> {
  const contentLength = Number(request.headers.get('content-length') ?? '0')
  if (contentLength > maximumReportHtmlBytes + 64 * 1024) {
    return errorResponse('REPORT_FILE_TOO_LARGE', 413)
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return errorResponse('INVALID_MULTIPART_FORM', 400)
  }
  const file = formData.get('file')
  const paperVersionId = formData.get('paperVersionId')
  if (!(file instanceof File) || typeof paperVersionId !== 'string') {
    return errorResponse('INVALID_REPORT_IMPORT', 400)
  }

  try {
    const result = await createReportImport({
      paperVersionId,
      originalFileName: file.name,
      htmlBytes: new Uint8Array(await file.arrayBuffer()),
    })
    return NextResponse.json(result, {
      status: 201,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    if (error instanceof ReportImportRequestError) {
      return errorResponse(error.code, error.status)
    }
    if (error instanceof TypeError) {
      return errorResponse('REPORT_HTML_NOT_UTF8', 400)
    }
    if (error instanceof Error && error.message.includes('requires EDITOR')) {
      return errorResponse('EDITOR_PERMISSION_REQUIRED', 403)
    }
    return errorResponse('REPORT_IMPORT_FAILED', 500)
  }
}

function errorResponse(code: string, status: number): NextResponse {
  return NextResponse.json(
    { error: { code } },
    { status, headers: { 'Cache-Control': 'no-store' } },
  )
}
