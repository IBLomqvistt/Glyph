'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Download,
  Expand,
  FileText,
  Minus,
  Plus,
} from 'lucide-react'
import { Button } from '@glyph/ui'
import type { EvidenceSpan } from '@glyph/domain'
import { normalizedBoxStyle } from './pdf-page'

export type PdfGlyphAnnotation = {
  id: string
  evidenceId: string
  text: string
}

export function ContinuousPdfViewer({
  title,
  pdfPath,
  pageCount,
  pageImageBasePath,
  evidenceSpans,
  annotations,
}: {
  title: string
  pdfPath: string
  pageCount: number
  pageImageBasePath: string
  evidenceSpans: readonly EvidenceSpan[]
  annotations: readonly PdfGlyphAnnotation[]
}): React.JSX.Element {
  const viewportRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<HTMLDivElement>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState('1')
  const [zoom, setZoom] = useState(0.9)
  const annotationsByEvidence = new Map(
    annotations.map((annotation) => [annotation.evidenceId, annotation]),
  )

  useEffect(() => setPageInput(String(currentPage)), [currentPage])

  useEffect(() => {
    const openEvidence = (event: Event): void => {
      const evidenceId = (event as CustomEvent<{ evidenceId?: string }>).detail
        ?.evidenceId
      const evidence = evidenceSpans.find((item) => item.id === evidenceId)
      if (!evidence) return
      setCurrentPage(evidence.pageNumber)
      viewportRef.current
        ?.querySelector<HTMLElement>(
          `[data-page-number="${evidence.pageNumber}"]`,
        )
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    window.addEventListener('glyph:open-evidence', openEvidence)
    return () => window.removeEventListener('glyph:open-evidence', openEvidence)
  }, [evidenceSpans])

  useEffect(() => {
    const root = viewportRef.current
    if (!root) return
    const ratios = new Map<number, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const page = Number(
            (entry.target as HTMLElement).dataset.pageNumber ?? '0',
          )
          if (page > 0) ratios.set(page, entry.intersectionRatio)
        }
        const next = [...ratios.entries()].sort(
          (left, right) => right[1] - left[1],
        )[0]
        if (next && next[1] > 0) setCurrentPage(next[0])
      },
      { root, threshold: [0, 0.15, 0.35, 0.55, 0.75] },
    )
    root
      .querySelectorAll<HTMLElement>('[data-page-number]')
      .forEach((page) => observer.observe(page))
    return () => observer.disconnect()
  }, [])

  function goToPage(): void {
    const parsed = Number.parseInt(pageInput, 10)
    const page = Math.min(
      pageCount,
      Math.max(1, Number.isNaN(parsed) ? 1 : parsed),
    )
    setPageInput(String(page))
    setCurrentPage(page)
    viewportRef.current
      ?.querySelector<HTMLElement>(`[data-page-number="${page}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function enterFullscreen(): Promise<void> {
    await viewerRef.current?.requestFullscreen()
  }

  return (
    <section
      ref={viewerRef}
      className="continuous-pdf-viewer"
      aria-label={`${title} source PDF`}
    >
      <div className="continuous-pdf-toolbar" aria-label="PDF controls">
        <FileText aria-hidden="true" />
        <label>
          <span className="sr-only">Source page number</span>
          <input
            aria-label="Source page number"
            inputMode="numeric"
            value={pageInput}
            onChange={(event) => setPageInput(event.target.value)}
            onBlur={goToPage}
            onKeyDown={(event) => {
              if (event.key === 'Enter') goToPage()
            }}
          />
          <span>/ {pageCount}</span>
        </label>
        <span className="pdf-toolbar-spacer" aria-hidden="true" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Zoom out"
          disabled={zoom <= 0.7}
          onClick={() => setZoom((value) => Math.max(0.7, value - 0.1))}
        >
          <Minus aria-hidden="true" />
        </Button>
        <span className="zoom-value">{Math.round(zoom * 100)}%</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Zoom in"
          disabled={zoom >= 1.2}
          onClick={() => setZoom((value) => Math.min(1.2, value + 0.1))}
        >
          <Plus aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="View source fullscreen"
          onClick={() => void enterFullscreen()}
        >
          <Expand aria-hidden="true" />
        </Button>
        <a href={pdfPath} download aria-label="Download source PDF">
          <Download aria-hidden="true" />
        </a>
      </div>

      <div ref={viewportRef} className="continuous-pdf-viewport">
        {Array.from({ length: pageCount }, (_, index) => {
          const pageNumber = index + 1
          const pageEvidence = evidenceSpans.filter(
            (evidence) => evidence.pageNumber === pageNumber,
          )
          return (
            <ContinuousPdfPage
              key={pageNumber}
              pageNumber={pageNumber}
              imagePath={`${pageImageBasePath}/page-${String(pageNumber).padStart(2, '0')}.png`}
              zoom={zoom}
              evidenceSpans={pageEvidence}
              annotationsByEvidence={annotationsByEvidence}
              current={pageNumber === currentPage}
            />
          )
        })}
      </div>
    </section>
  )
}

function ContinuousPdfPage({
  pageNumber,
  imagePath,
  zoom,
  evidenceSpans,
  annotationsByEvidence,
  current,
}: {
  pageNumber: number
  imagePath: string
  zoom: number
  evidenceSpans: readonly EvidenceSpan[]
  annotationsByEvidence: ReadonlyMap<string, PdfGlyphAnnotation>
  current: boolean
}): React.JSX.Element {
  const imageRef = useRef<HTMLImageElement>(null)
  const [state, setState] = useState<'ready' | 'error'>('ready')

  useEffect(() => {
    const image = imageRef.current
    if (!image) return
    let cancelled = false
    const markReady = (): void => {
      if (!cancelled) setState(image.naturalWidth > 0 ? 'ready' : 'error')
    }
    const markError = (): void => {
      if (!cancelled) setState('error')
    }
    image.addEventListener('load', markReady)
    image.addEventListener('error', markError)
    if (image.complete) markReady()
    else void image.decode().then(markReady, markError)
    return () => {
      cancelled = true
      image.removeEventListener('load', markReady)
      image.removeEventListener('error', markError)
    }
  }, [imagePath])

  return (
    <article
      className={`continuous-pdf-page${current ? ' is-current' : ''}`}
      data-page-number={pageNumber}
      aria-label={`Source page ${pageNumber}`}
    >
      <div
        className="continuous-pdf-page-canvas"
        style={{ width: `${Math.round(595 * zoom)}px` }}
      >
        {state === 'error' ? (
          <div className="pdf-status pdf-error" role="alert">
            <AlertTriangle aria-hidden="true" /> Source page failed to load.
          </div>
        ) : null}
        {/* A native lazy image keeps all pages in one scroll surface and handles cached completion. */}
        <img
          ref={imageRef}
          src={imagePath}
          loading={pageNumber <= 2 ? 'eager' : 'lazy'}
          alt={`Rendered source PDF page ${pageNumber}`}
          onLoad={() => setState('ready')}
          onError={() => setState('error')}
        />
        {state === 'ready'
          ? evidenceSpans.flatMap((evidence, evidenceIndex) =>
              evidence.boxes.map((box, boxIndex) => (
                <span
                  key={`${evidence.id}-${boxIndex}`}
                  className="continuous-evidence-highlight"
                  style={normalizedBoxStyle(box)}
                  aria-label={`Evidence ${evidenceIndex + 1}: ${evidence.section}`}
                />
              )),
            )
          : null}
      </div>
      <div className="continuous-page-notes">
        {evidenceSpans.map((evidence) => {
          const annotation = annotationsByEvidence.get(evidence.id)
          const annotationTop = Math.min(evidence.boxes[0]?.y ?? 0.05, 0.82)
          return annotation ? (
            <aside
              key={annotation.id}
              className="pdf-glyph-annotation"
              data-evidence-id={evidence.id}
              style={{ top: `${annotationTop * 100}%` }}
            >
              <strong>Glyph</strong>
              <p>{annotation.text}</p>
              <small>Source page {pageNumber}</small>
            </aside>
          ) : null
        })}
      </div>
    </article>
  )
}
