'use client'

import { useState } from 'react'
import { Check, LoaderCircle } from 'lucide-react'
import { Button } from '@glyph/ui'

export function ReportImportReviewActions({
  draftId,
  blockerCount,
  approved,
}: {
  draftId: string
  blockerCount: number
  approved: boolean
}): React.JSX.Element {
  const [state, setState] = useState<'idle' | 'saving' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function approve(): Promise<void> {
    setState('saving')
    try {
      const response = await fetch(
        `/api/editor/report-imports/${encodeURIComponent(draftId)}/approve`,
        { method: 'POST' },
      )
      const payload = (await response.json()) as {
        reportUrl?: string
        error?: { code?: string }
      }
      if (!response.ok || !payload.reportUrl) {
        throw new Error(payload.error?.code ?? 'APPROVAL_FAILED')
      }
      window.location.assign(payload.reportUrl)
    } catch (error) {
      setState('error')
      setMessage(error instanceof Error ? error.message : 'APPROVAL_FAILED')
    }
  }

  return (
    <div className="report-review-actions">
      <Button
        type="button"
        disabled={blockerCount > 0 || approved || state === 'saving'}
        onClick={() => void approve()}
      >
        {state === 'saving' ? (
          <>
            <LoaderCircle className="spin" aria-hidden="true" /> Approving…
          </>
        ) : (
          <>
            <Check aria-hidden="true" />{' '}
            {approved ? 'Approved' : 'Approve report'}
          </>
        )}
      </Button>
      {blockerCount > 0 ? (
        <p>{blockerCount} blocker(s) must be resolved before approval.</p>
      ) : null}
      {state === 'error' ? (
        <p className="form-error" role="alert">
          Approval failed: {message}
        </p>
      ) : null}
    </div>
  )
}
