'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReportPackage, ReportTabId } from '@glyph/domain'

const allowedTabs: readonly ReportTabId[] = [
  'summary',
  'mechanism',
  'economics',
]

export function ReportTabViewer({
  reportPackage,
}: {
  reportPackage: ReportPackage
}): React.JSX.Element {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [activeTab, setActiveTab] = useState<ReportTabId>('summary')
  const [glyphMode, setGlyphMode] = useState(false)

  useEffect(() => {
    const selected = window.location.hash.slice(1)
    if (allowedTabs.includes(selected as ReportTabId)) {
      setActiveTab(selected as ReportTabId)
    }
  }, [])

  useEffect(() => {
    const updateGlyphMode = (event: Event): void => {
      const active =
        (event as CustomEvent<{ active?: boolean }>).detail?.active === true
      setGlyphMode(active)
    }
    window.addEventListener('glyph:mode', updateGlyphMode)
    return () => window.removeEventListener('glyph:mode', updateGlyphMode)
  }, [])

  useEffect(() => {
    const receiveSelection = (event: MessageEvent<unknown>): void => {
      if (event.source !== frameRef.current?.contentWindow) return
      if (
        typeof event.data !== 'object' ||
        event.data === null ||
        !('type' in event.data) ||
        event.data.type !== 'glyph:selection' ||
        !('text' in event.data) ||
        typeof event.data.text !== 'string'
      ) {
        return
      }
      const text = event.data.text.replace(/\s+/gu, ' ').trim().slice(0, 600)
      if (text.length < 3) return
      window.dispatchEvent(
        new CustomEvent('glyph:selection', { detail: { text } }),
      )
    }
    window.addEventListener('message', receiveSelection)
    return () => window.removeEventListener('message', receiveSelection)
  }, [])

  useEffect(() => {
    frameRef.current?.contentWindow?.postMessage(
      { type: 'glyph:mode', active: glyphMode },
      '*',
    )
  }, [activeTab, glyphMode])

  const activeSectionHtml = useMemo(
    () =>
      reportPackage.sections
        .filter((section) => section.tabId === activeTab)
        .map((section) => section.html)
        .join('\n'),
    [activeTab, reportPackage.sections],
  )
  const sourceDocument = useMemo(
    () => buildReportSourceDocument(reportPackage.themeCss, activeSectionHtml),
    [activeSectionHtml, reportPackage.themeCss],
  )

  function selectTab(tabId: ReportTabId): void {
    setActiveTab(tabId)
    window.history.replaceState(null, '', `#${tabId}`)
  }

  return (
    <div className="structured-report-tabs">
      <div
        className="structured-tab-list"
        role="tablist"
        aria-label="Report sections"
      >
        {reportPackage.tabs.map((tab) => (
          <button
            key={tab.id}
            id={`report-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls="structured-report-panel"
            onClick={() => selectTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        id="structured-report-panel"
        className="structured-report-panel"
        role="tabpanel"
        aria-labelledby={`report-tab-${activeTab}`}
      >
        <iframe
          ref={frameRef}
          key={activeTab}
          className="structured-report-frame"
          title={`${reportPackage.metadata.title}: ${activeTab}`}
          sandbox="allow-scripts"
          srcDoc={sourceDocument}
          onLoad={() =>
            frameRef.current?.contentWindow?.postMessage(
              { type: 'glyph:mode', active: glyphMode },
              '*',
            )
          }
        />
      </div>
    </div>
  )
}

function buildReportSourceDocument(themeCss: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${themeCss}\n.gr-digest .tabpane{display:block!important;padding:8px 0 72px}.panel,.tablewrap{max-width:100%;overflow:auto}img,svg{max-width:100%;height:auto}.glyphdock,.tabbar,.buddy,.buddy-bubble,.askpop,.glyphpop,.toast{display:none!important}body.glyph-selection-mode .gr-digest{cursor:text}body.glyph-selection-mode ::selection{color:inherit;background:rgba(255,210,92,.58)}</style></head><body><main class="gr-digest">${body}</main><script>(()=>{let active=false;const sendSelection=()=>{if(!active)return;const text=String(window.getSelection?.()??'').replace(/\\s+/g,' ').trim();if(text.length>2)parent.postMessage({type:'glyph:selection',text:text.slice(0,600)},'*')};window.addEventListener('message',(event)=>{const data=event.data;if(!data||data.type!=='glyph:mode')return;active=data.active===true;document.body.classList.toggle('glyph-selection-mode',active)});document.addEventListener('mouseup',sendSelection);document.addEventListener('keyup',(event)=>{if(event.key==='Shift'||event.key.startsWith('Arrow'))sendSelection()})})()</script></body></html>`
}
