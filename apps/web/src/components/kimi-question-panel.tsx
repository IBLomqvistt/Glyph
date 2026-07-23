'use client'

import Image from 'next/image'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { AlertTriangle, LoaderCircle, Sparkles, X } from 'lucide-react'
import { Button, Card } from '@glyph/ui'
import {
  isKimiQuestionResponse,
  kimiQuestionMaxLength,
  kimiQuestionMinLength,
  type KimiQuestionResponse,
} from '@/lib/kimi-question-contract'
import { kimiEvidenceSpans } from '@/lib/report-catalog'

type KimiEvidenceId = (typeof kimiEvidenceSpans)[number]['id']
const evidenceById = new Map(
  kimiEvidenceSpans.map((evidence, index) => [
    evidence.id,
    { ...evidence, number: index + 1 },
  ]),
)

function isKimiEvidenceId(value: string): value is KimiEvidenceId {
  return evidenceById.has(value)
}

function friendlyError(status: number): string {
  if (status === 400) return 'Ask a question between 3 and 500 characters.'
  if (status === 429) {
    return 'This report has reached its public question limit for now.'
  }
  if (status === 503) {
    return 'Live Glyph analysis is not available in this environment.'
  }
  return 'Glyph could not produce a validated answer. Please try again.'
}

export function KimiQuestionPanel({
  slug,
  activeEvidenceId = null,
  onSelectEvidence,
}: {
  slug: string
  activeEvidenceId?: KimiEvidenceId | null
  onSelectEvidence?: (evidenceId: KimiEvidenceId) => void
}): React.JSX.Element {
  const questionId = useId()
  const questionRef = useRef<HTMLTextAreaElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPassage, setSelectedPassage] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle')
  const [answer, setAnswer] = useState<KimiQuestionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const receiveSelection = (event: Event): void => {
      const selectedText = (
        event as CustomEvent<{ text?: string }>
      ).detail?.text
        ?.replace(/\s+/gu, ' ')
        .trim()
        .slice(0, 320)
      if (!selectedText) return
      setSelectedPassage(selectedText)
      setIsOpen(true)
      setQuestion((current) =>
        current.trim() ? current : 'Explain why this matters for an investor.',
      )
      window.setTimeout(() => questionRef.current?.focus(), 0)
    }
    window.addEventListener('glyph:selection', receiveSelection)
    return () => window.removeEventListener('glyph:selection', receiveSelection)
  }, [])

  function setGlyphMode(active: boolean): void {
    setIsOpen(active)
    window.dispatchEvent(new CustomEvent('glyph:mode', { detail: { active } }))
  }

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
    const selectionBudget =
      kimiQuestionMaxLength - normalizedQuestion.length - 40
    const requestQuestion =
      selectedPassage && selectionBudget > 24
        ? `Report passage: "${selectedPassage.slice(0, selectionBudget)}"\nQuestion: ${normalizedQuestion}`
        : normalizedQuestion
    try {
      const response = await fetch(`/api/reports/${slug}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: requestQuestion }),
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

  if (!isOpen) {
    return (
      <div className="glyph-launcher-shell">
        <button
          type="button"
          className="glyph-launcher"
          aria-label="Glyph it"
          aria-expanded="false"
          aria-controls={`${questionId}-panel`}
          onClick={() => setGlyphMode(true)}
        >
          <Image
            src="/assets/glyph/glyph-mascot-v2.png"
            alt=""
            width={46}
            height={46}
            loading="eager"
          />
          <span>
            <strong>Glyph it</strong>
            <small>Open Glyph, then highlight anything in the report</small>
          </span>
        </button>
      </div>
    )
  }

  return (
    <Card
      id={`${questionId}-panel`}
      className="kimi-question-panel is-open"
      aria-labelledby={`${questionId}-title`}
    >
      <div className="kimi-question-heading">
        <Image
          className="kimi-question-mascot"
          src="/assets/glyph/glyph-mascot-v2.png"
          alt=""
          width={52}
          height={52}
          loading="eager"
        />
        <div>
          <h2 id={`${questionId}-title`}>Glyph it</h2>
          <p>
            Highlight report text, then ask. Answers stay tied to mapped source
            evidence.
          </p>
        </div>
        <button
          type="button"
          className="kimi-question-close"
          aria-label="Close Glyph"
          onClick={() => setGlyphMode(false)}
        >
          <X aria-hidden="true" size={18} />
        </button>
      </div>

      {selectedPassage ? (
        <div className="kimi-selected-passage">
          <div>
            <span>Selected report text</span>
            <button type="button" onClick={() => setSelectedPassage(null)}>
              Clear
            </button>
          </div>
          <blockquote>{selectedPassage}</blockquote>
        </div>
      ) : (
        <p className="kimi-selection-prompt">
          Selection mode is on. Highlight a sentence or paragraph inside the
          report.
        </p>
      )}

      <form
        className="kimi-question-form"
        onSubmit={(event) => void submitQuestion(event)}
      >
        <label className="sr-only" htmlFor={questionId}>
          Ask a question about the Kimi K3 source
        </label>
        <textarea
          ref={questionRef}
          id={questionId}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          minLength={kimiQuestionMinLength}
          maxLength={kimiQuestionMaxLength}
          rows={2}
          required
          disabled={status === 'loading'}
          placeholder={
            selectedPassage
              ? 'What do you want to understand about this passage?'
              : 'Ask about a claim or mechanism'
          }
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
          {status === 'loading' ? 'Checking evidence…' : 'Ask Glyph'}
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
                The validated source passages do not directly answer this
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
                  .map((evidenceId) => {
                    const evidence = evidenceById.get(evidenceId)
                    if (!evidence) return null
                    return (
                      <button
                        key={evidenceId}
                        type="button"
                        className={
                          activeEvidenceId === evidenceId
                            ? 'is-active'
                            : undefined
                        }
                        aria-label={`Open cited source passage ${evidence.number}`}
                        onClick={() => {
                          onSelectEvidence?.(evidenceId)
                          window.dispatchEvent(
                            new CustomEvent('glyph:open-evidence', {
                              detail: { evidenceId },
                            }),
                          )
                        }}
                      >
                        {evidence.number}
                      </button>
                    )
                  })}
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
              {' · '}
              {answer.quota.sessionReportDailyLimit} public questions per
              report/day
            </small>
          </div>
        ) : null}
      </div>
    </Card>
  )
}
