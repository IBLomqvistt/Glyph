'use client'

import { useId, useState, type FormEvent } from 'react'
import { AlertTriangle, LoaderCircle, Sparkles } from 'lucide-react'
import { Button, Card } from '@glyph/ui'
import {
  isKimiQuestionResponse,
  kimiQuestionMaxLength,
  kimiQuestionMinLength,
  type KimiQuestionResponse,
} from '@/lib/kimi-question-contract'
import { kimiEvidenceMappings } from '@/lib/kimi-reader-content'

type KimiEvidenceId = keyof typeof kimiEvidenceMappings

function isKimiEvidenceId(value: string): value is KimiEvidenceId {
  return value in kimiEvidenceMappings
}

function friendlyError(status: number): string {
  if (status === 400) return 'Ask a question between 3 and 500 characters.'
  if (status === 503) {
    return 'Live Glyph analysis is not available in this environment.'
  }
  return 'Glyph could not produce a validated answer. Please try again.'
}

export function KimiQuestionPanel({
  slug,
  activeEvidenceId,
  onSelectEvidence,
}: {
  slug: string
  activeEvidenceId: KimiEvidenceId | null
  onSelectEvidence: (evidenceId: KimiEvidenceId) => void
}): React.JSX.Element {
  const questionId = useId()
  const [question, setQuestion] = useState('')
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle')
  const [answer, setAnswer] = useState<KimiQuestionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedQuestion = question.trim()
    if (
      normalizedQuestion.length < kimiQuestionMinLength ||
      normalizedQuestion.length > kimiQuestionMaxLength
    ) {
      setAnswer(null)
      setError('Ask a question between 3 and 500 characters.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setAnswer(null)
    setError(null)
    try {
      const response = await fetch(`/api/reports/${slug}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: normalizedQuestion }),
        cache: 'no-store',
      })
      const payload: unknown = await response.json().catch(() => null)
      if (!response.ok) {
        setError(friendlyError(response.status))
        setStatus('error')
        return
      }
      if (!isKimiQuestionResponse(payload)) {
        setError('Glyph returned an invalid answer and it was not displayed.')
        setStatus('error')
        return
      }
      setAnswer(payload)
      setStatus('success')
    } catch {
      setError('Glyph could not reach the analysis service. Please try again.')
      setStatus('error')
    }
  }

  return (
    <Card
      className="kimi-question-panel"
      aria-labelledby={`${questionId}-title`}
    >
      <div className="kimi-question-heading">
        <span className="kimi-question-mark" aria-hidden="true">
          <Sparkles size={19} />
        </span>
        <div>
          <h2 id={`${questionId}-title`}>Glyph it</h2>
          <p>
            Ask the source. Every answer must link to an exact mapped passage.
          </p>
        </div>
      </div>

      <form
        className="kimi-question-form"
        onSubmit={(event) => void submitQuestion(event)}
      >
        <label className="sr-only" htmlFor={questionId}>
          Ask a question about the Kimi K3 source
        </label>
        <textarea
          id={questionId}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          minLength={kimiQuestionMinLength}
          maxLength={kimiQuestionMaxLength}
          rows={2}
          required
          disabled={status === 'loading'}
          placeholder="What does the source support about K3's expert routing?"
        />
        <Button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? (
            <LoaderCircle
              className="kimi-question-spinner"
              aria-hidden="true"
            />
          ) : (
            <Sparkles aria-hidden="true" />
          )}
          {status === 'loading' ? 'Checking evidence…' : 'Glyph it'}
        </Button>
      </form>

      <div className="kimi-question-live" aria-live="polite" aria-atomic="true">
        {status === 'loading' ? (
          <p className="kimi-question-status">
            Checking the mapped source passages…
          </p>
        ) : null}
        {status === 'error' && error ? (
          <p className="kimi-question-error" role="alert">
            <AlertTriangle aria-hidden="true" size={17} /> {error}
          </p>
        ) : null}
        {status === 'success' && answer ? (
          <div
            className={`kimi-question-answer${answer.outcome === 'INSUFFICIENT_EVIDENCE' ? ' is-insufficient' : ''}`}
          >
            <strong>
              {answer.outcome === 'ANSWER'
                ? 'Evidence-bound answer'
                : 'Insufficient evidence'}
            </strong>
            {answer.answerText ? (
              <p>{answer.answerText}</p>
            ) : (
              <p>
                The two mapped source passages do not directly answer this
                question. Glyph will not fill the gap with a plausible fallback.
              </p>
            )}
            {answer.evidenceIds.length > 0 ? (
              <div
                className="kimi-question-citations"
                aria-label="Answer citations"
              >
                <span>Exact source</span>
                {answer.evidenceIds
                  .filter(isKimiEvidenceId)
                  .map((evidenceId) => (
                    <button
                      key={evidenceId}
                      type="button"
                      className={
                        activeEvidenceId === evidenceId
                          ? 'is-active'
                          : undefined
                      }
                      aria-label={`Open cited source passage ${kimiEvidenceMappings[evidenceId].number}`}
                      onClick={() => onSelectEvidence(evidenceId)}
                    >
                      {kimiEvidenceMappings[evidenceId].number}
                    </button>
                  ))}
              </div>
            ) : null}
            <small>
              {answer.model} ·{' '}
              <time dateTime={answer.timestamp}>
                {new Date(answer.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
            </small>
          </div>
        ) : null}
      </div>
    </Card>
  )
}
