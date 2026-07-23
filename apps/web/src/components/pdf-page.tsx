'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, LoaderCircle } from 'lucide-react'
import type { NormalizedBox } from '@glyph/domain'

export function normalizedBoxStyle(box: NormalizedBox): {
  left: string
  top: string
  width: string
  height: string
} {
  return {
    left: `${box.x * 100}%`,
    top: `${box.y * 100}%`,
    width: `${box.width * 100}%`,
    height: `${box.height * 100}%`,
  }
}

export function PdfPage({
  src,
  pageNumber,
  zoom,
  boxes,
  onHighlight,
  pageImagePath,
  highlightNumber,
}: {
  src: string
  pageNumber: number
  zoom: number
  boxes: readonly NormalizedBox[]
  onHighlight: () => void
  pageImagePath?: string
  highlightNumber?: number
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const highlightRef = useRef<HTMLButtonElement>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    if (!pageImagePath) return
    setState('loading')
    const image = imageRef.current
    if (image?.complete) {
      setState(image.naturalWidth > 0 ? 'ready' : 'error')
    }
  }, [pageImagePath])

  useEffect(() => {
    if (pageImagePath) return

    let cancelled = false
    let loadingTask: { destroy: () => Promise<void> } | undefined

    async function renderPage(): Promise<void> {
      setState('loading')
      try {
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString()
        const task = pdfjs.getDocument({ url: src })
        loadingTask = task
        const document = await task.promise
        const page = await document.getPage(pageNumber)
        const viewport = page.getViewport({ scale: zoom })
        const canvas = canvasRef.current
        if (!canvas || cancelled) {
          page.cleanup()
          await task.destroy()
          return
        }
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Canvas is unavailable.')
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        canvas.style.width = `${Math.floor(viewport.width)}px`
        canvas.style.height = `${Math.floor(viewport.height)}px`
        await page.render({ canvas, canvasContext: context, viewport }).promise
        if (!cancelled) setState('ready')
        page.cleanup()
      } catch {
        if (!cancelled) setState('error')
      }
    }

    void renderPage()
    return () => {
      cancelled = true
      if (loadingTask) void loadingTask.destroy()
    }
  }, [pageImagePath, pageNumber, src, zoom])

  useEffect(() => {
    if (state !== 'ready' || boxes.length === 0) return
    highlightRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    })
  }, [boxes, pageNumber, state, zoom])

  return (
    <div className="pdf-stage" data-testid="pdf-page" data-page={pageNumber}>
      {state === 'loading' ? (
        <div className="pdf-status">
          <LoaderCircle aria-hidden="true" /> Rendering exact source page…
        </div>
      ) : null}
      {state === 'error' ? (
        <div className="pdf-status pdf-error" role="alert">
          <AlertTriangle aria-hidden="true" /> PDF rendering failed. No
          approximate passage is shown.
        </div>
      ) : null}
      <div
        className="pdf-canvas-wrap"
        aria-label={`Source PDF page ${pageNumber}`}
      >
        {pageImagePath ? (
          <Image
            ref={imageRef}
            className="pdf-page-image"
            src={pageImagePath}
            width={1190}
            height={1684}
            unoptimized
            priority={pageNumber === 1}
            alt={`Rendered source PDF page ${pageNumber}`}
            style={{
              width: `${Math.round(595 * zoom)}px`,
              height: 'auto',
            }}
            onLoad={() => setState('ready')}
            onError={() => setState('error')}
          />
        ) : (
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`Rendered source PDF page ${pageNumber}`}
          />
        )}
        {state === 'ready'
          ? boxes.map((box, index) => (
              <button
                key={`${box.x}-${box.y}-${index}`}
                ref={index === 0 ? highlightRef : undefined}
                type="button"
                className="evidence-highlight"
                data-testid="evidence-highlight"
                aria-label="Selected evidence highlight; show connected claims"
                style={normalizedBoxStyle(box)}
                onClick={onHighlight}
              >
                {index === 0 && highlightNumber ? (
                  <span className="evidence-badge" aria-hidden="true">
                    {highlightNumber}
                  </span>
                ) : null}
              </button>
            ))
          : null}
      </div>
    </div>
  )
}
