'use client'

import { useState } from 'react'
import { FileCode2, LoaderCircle, UploadCloud } from 'lucide-react'
import { Button } from '@glyph/ui'

type ImportResponse = {
  previewUrl?: string
  blockers?: unknown[]
  error?: { code?: string }
}

export function ReportImportUpload(): React.JSX.Element {
  const [state, setState] = useState<'idle' | 'uploading' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function upload(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()
    setState('uploading')
    setMessage('')
    const form = event.currentTarget
    try {
      const response = await fetch('/api/editor/report-imports', {
        method: 'POST',
        body: new FormData(form),
      })
      const payload = (await response.json()) as ImportResponse
      if (!response.ok || !payload.previewUrl) {
        throw new Error(payload.error?.code ?? 'REPORT_IMPORT_FAILED')
      }
      window.location.assign(payload.previewUrl)
    } catch (error) {
      setState('error')
      setMessage(
        error instanceof Error ? error.message : 'REPORT_IMPORT_FAILED',
      )
    }
  }

  return (
    <form
      className="report-import-form"
      onSubmit={(event) => void upload(event)}
    >
      <input
        type="hidden"
        name="paperVersionId"
        value="kimi-k3-tech-blog-2026-07-21"
      />
      <label htmlFor="claude-report-html">
        <FileCode2 aria-hidden="true" />
        <span>
          <strong>Claude report HTML</strong>
          <small>Marked HTML, inline SVG and tables · 10 MB maximum</small>
        </span>
      </label>
      <input
        id="claude-report-html"
        name="file"
        type="file"
        accept=".html,text/html"
        required
      />
      <Button type="submit" disabled={state === 'uploading'}>
        {state === 'uploading' ? (
          <>
            <LoaderCircle className="spin" aria-hidden="true" /> Importing…
          </>
        ) : (
          <>
            <UploadCloud aria-hidden="true" /> Import and review
          </>
        )}
      </Button>
      {state === 'error' ? (
        <p className="form-error" role="alert">
          Import failed: {message}
        </p>
      ) : null}
    </form>
  )
}
